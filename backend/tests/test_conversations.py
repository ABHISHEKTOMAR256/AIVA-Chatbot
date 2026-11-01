"""Conversation management, message persistence, and feedback tests."""

import pytest


@pytest.mark.asyncio
async def test_start_conversation_and_chat(client, regular_profile):
    """Test starting a conversation and persisting messages."""
    # First message creates conversation
    res = await client.post("/api/chat", json={
        "message": "Hello AIVA, what time does the hostel mess close?",
    })
    assert res.status_code == 200
    data = res.json()
    assert "conversation_id" in data
    assert "response" in data
    conv_id = data["conversation_id"]

    # Retrieve conversation messages
    get_res = await client.get(f"/api/conversations/{conv_id}")
    assert get_res.status_code == 200
    details = get_res.json()
    assert len(details["messages"]) >= 2  # user + AI
    assert details["messages"][0]["content"] == "Hello AIVA, what time does the hostel mess close?"


@pytest.mark.asyncio
async def test_close_and_submit_feedback(client, regular_profile):
    """Test closing a conversation and submitting rating feedback."""
    res = await client.post("/api/chat", json={"message": "Can I report a broken chair?"})
    conv_id = res.json()["conversation_id"]

    # Close conversation
    close_res = await client.post(f"/api/conversations/{conv_id}/close")
    assert close_res.status_code == 200
    assert close_res.json()["status"] == "closed"

    # Submit feedback
    fb_res = await client.post(f"/api/conversations/{conv_id}/feedback", json={
        "conversation_id": conv_id,
        "rating": 5,
        "comment": "Quick and helpful!",
    })
    assert fb_res.status_code == 200
    assert fb_res.json()["rating"] == 5
