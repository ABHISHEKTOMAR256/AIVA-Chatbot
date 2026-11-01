"""Complaint creation, tracking, user isolation, and admin update tests."""

import pytest


@pytest.mark.asyncio
async def test_create_complaint(client, regular_profile):
    """Test complaint creation with auto-generated reference number."""
    payload = {
        "category": "electricity",
        "title": "Ceiling fan not working",
        "description": "The ceiling fan in room 302 stopped spinning yesterday evening.",
        "room_number": "302",
        "location": "Block B, 3rd Floor",
        "priority": "medium",
    }
    res = await client.post("/api/complaints", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["reference_number"].startswith("AIVA-")
    assert data["status"] == "submitted"
    assert data["category"] == "electricity"


@pytest.mark.asyncio
async def test_create_complaint_invalid_category(client, regular_profile):
    """Test validation fails for invalid category."""
    payload = {
        "category": "rocket_science",
        "title": "Invalid category test",
        "description": "This should fail validation because category is not supported.",
    }
    res = await client.post("/api/complaints", json=payload)
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_list_and_track_complaint(client, regular_profile):
    """Test student can track their complaint by reference number."""
    payload = {
        "category": "wifi",
        "title": "No internet access",
        "description": "Cannot connect to campus Wi-Fi from room 104.",
        "room_number": "104",
    }
    create_res = await client.post("/api/complaints", json=payload)
    ref = create_res.json()["reference_number"]

    # List complaints
    list_res = await client.get("/api/complaints")
    assert list_res.status_code == 200
    complaints = list_res.json()
    assert any(c["reference_number"] == ref for c in complaints)

    # Track by reference
    track_res = await client.get(f"/api/complaints/{ref}")
    assert track_res.status_code == 200
    assert track_res.json()["reference_number"] == ref


@pytest.mark.asyncio
async def test_admin_update_complaint(admin_client, client, regular_profile, admin_profile):
    """Test admin updating complaint status and assigning staff."""
    # 1. Create complaint as regular user
    create_res = await client.post("/api/complaints", json={
        "category": "plumbing",
        "title": "Leaking tap in washroom",
        "description": "Continuous water drip in 2nd floor common washroom.",
        "room_number": "201",
    })
    comp_id = create_res.json()["id"]

    # 2. Update as admin
    update_res = await admin_client.patch(f"/api/admin/complaints/{comp_id}", json={
        "status": "in_progress",
        "priority": "high",
        "staff_reply": "Plumber dispatched to inspect washroom tap.",
    })
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["status"] == "in_progress"
    assert updated["priority"] == "high"
    assert updated["staff_reply"] == "Plumber dispatched to inspect washroom tap."
