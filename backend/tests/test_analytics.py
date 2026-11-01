"""Analytics calculations, real database counting, and 25-conversation progress tests."""

import pytest


@pytest.mark.asyncio
async def test_analytics_dashboard_stats(admin_client, client, regular_profile, admin_profile):
    """Test dashboard stats reflect genuine database counts."""
    # Create 1 complaint
    await client.post("/api/complaints", json={
        "category": "cleaning",
        "title": "Corridor cleaning required",
        "description": "Corridor dustbin on 4th floor is overflowing.",
    })

    # Fetch admin stats
    res = await admin_client.get("/api/admin/dashboard")
    assert res.status_code == 200
    stats = res.json()
    assert stats["total_complaints"] >= 1
    assert stats["open_complaints"] >= 1


@pytest.mark.asyncio
async def test_25_conversation_progress(admin_client, admin_profile):
    """Test the 25-conversation progress calculation."""
    res = await admin_client.get("/api/admin/analytics/progress")
    assert res.status_code == 200
    progress = res.json()
    assert progress["target"] == 25
    assert "total_genuine" in progress
    assert "percentage" in progress
    assert progress["remaining"] == 25 - progress["total_genuine"]


@pytest.mark.asyncio
async def test_analytics_csv_export(admin_client, admin_profile):
    """Test exporting analytics data to CSV."""
    res = await admin_client.get("/api/admin/analytics/export")
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("text/csv")
    csv_text = res.text
    assert "metric,value" in csv_text or "total_users" in csv_text
