import pytest
from fastapi import HTTPException
from schema import And, Schema

from app.services.players.stats import TransfermarktPlayerStats


def test_players_stats_not_found():
    with pytest.raises(HTTPException):
        TransfermarktPlayerStats(player_id="0")


def test_players_stats_unknown_player_returns_empty():
    tfmkt = TransfermarktPlayerStats(player_id="999999999")
    result = tfmkt.get_player_stats()

    assert result["stats"] == []


@pytest.mark.parametrize("player_id", ["3373", "8198", "68290", "5023"])
def test_get_player_stats(player_id, len_greater_than_0, regex_integer):
    tfmkt = TransfermarktPlayerStats(player_id=player_id)
    result = tfmkt.get_player_stats()

    expected_schema = Schema(
        {
            "id": str,
            "stats": [
                {
                    "competitionId": And(str, len_greater_than_0),
                    "competitionName": str,
                    "seasonId": And(str, len_greater_than_0),
                    "clubId": And(str, len_greater_than_0, regex_integer),
                    "appearances": And(str, regex_integer),
                    "goals": And(str, regex_integer),
                    "assists": And(str, regex_integer),
                    "yellowCards": And(str, regex_integer),
                    "redCards": And(str, regex_integer),
                    "minutesPlayed": And(str, regex_integer),
                },
            ],
        },
    )

    assert expected_schema.validate(result)
    assert len(result["stats"]) > 0
    assert any(stat["competitionName"] for stat in result["stats"])


def test_get_player_stats_career_totals():
    """Messi's Barcelona appearances are a known, stable career total."""
    tfmkt = TransfermarktPlayerStats(player_id="28003")
    result = tfmkt.get_player_stats()

    barcelona_apps = sum(int(stat["appearances"]) for stat in result["stats"] if stat["clubId"] == "131")
    assert barcelona_apps == 778
