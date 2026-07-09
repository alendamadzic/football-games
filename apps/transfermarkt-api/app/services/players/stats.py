from dataclasses import dataclass

from fastapi import HTTPException

from app.services.base import TransfermarktBase


@dataclass
class TransfermarktPlayerStats(TransfermarktBase):
    """
    A class for retrieving and parsing the players stats from Transfermarkt.

    Transfermarkt no longer server-renders the stats pages (they 504 and the tables are
    rendered client-side), so this service consumes the JSON endpoint that powers those
    pages instead: one entry per career match, which gets aggregated here into rows per
    (season, competition, club).

    Args:
        player_id (str): The unique identifier of the player.
        URL (str): The URL template for the player's performance data endpoint.
        COMPETITIONS_URL (str): The endpoint used to resolve competition names in batch.
    """

    player_id: str = None
    URL: str = "https://www.transfermarkt.com/ceapi/performance-game/{player_id}"
    COMPETITIONS_URL: str = "https://tmapi.transfermarkt.technology/competitions"

    def __post_init__(self) -> None:
        """Initialize the TransfermarktPlayerStats class."""
        self.URL = self.URL.format(player_id=self.player_id)
        try:
            payload: dict = self.make_request().json()
        except ValueError:
            raise HTTPException(status_code=502, detail=f"Invalid JSON response (url: {self.URL})")
        if not payload.get("success") or not isinstance(payload.get("data"), dict):
            raise HTTPException(status_code=404, detail=f"Invalid request (url: {self.URL})")
        self.data: dict = payload["data"]

    def __resolve_competition_names(self, competition_ids: list) -> dict:
        """
        Resolve competition IDs to display names in a single batch request.

        Args:
            competition_ids (list): The competition IDs present in the player's stats.

        Returns:
            dict: A mapping of competition ID to competition name. Empty when the
                resolver endpoint is unavailable, in which case names are omitted.
        """
        if not competition_ids:
            return {}
        query = "&".join(f"ids[]={competition_id}" for competition_id in competition_ids)
        try:
            payload: dict = self.make_request(f"{self.COMPETITIONS_URL}?{query}").json()
        except (HTTPException, ValueError):
            return {}
        if not payload.get("success"):
            return {}
        return {competition.get("id"): competition.get("name") for competition in payload.get("data", [])}

    def __parse_player_stats(self) -> list:
        """
        Aggregate the per-match performance data into per (season, competition, club) rows.

        A match counts as an appearance only when the player actually played (bench,
        injury and absence entries are skipped).

        Returns:
            list: A list of dictionaries where each dictionary represents the statistics for a specific
                season, competition and club. Each dictionary includes keys for competition ID, club ID,
                season ID, competition name, and various statistical values for the player.
        """
        grouped: dict = {}
        for entry in self.data.get("performance", []):
            game = entry.get("gameInformation") or {}
            club = (entry.get("clubsInformation") or {}).get("club") or {}
            statistics = entry.get("statistics") or {}
            general = statistics.get("generalStatistics") or {}
            if general.get("participationState") != "played":
                continue

            key = (str(game.get("seasonId")), str(game.get("competitionId")), str(club.get("clubId")))
            stat = grouped.setdefault(
                key,
                {"appearances": 0, "goals": 0, "assists": 0, "yellowCards": 0, "redCards": 0, "minutesPlayed": 0},
            )
            goals = statistics.get("goalStatistics") or {}
            cards = statistics.get("cardStatistics") or {}
            playing_time = statistics.get("playingTimeStatistics") or {}
            stat["appearances"] += 1
            stat["goals"] += goals.get("goalsScoredTotalOfficial") or 0
            stat["assists"] += goals.get("assistsOfficial") or 0
            stat["yellowCards"] += 1 if cards.get("yellowCard") else 0
            stat["redCards"] += 1 if cards.get("redCard") else 0
            stat["minutesPlayed"] += playing_time.get("playedMinutes") or 0

        competition_names = self.__resolve_competition_names(sorted({key[1] for key in grouped}))
        return [
            {
                "competitionId": competition_id,
                "competitionName": competition_names.get(competition_id, ""),
                "seasonId": season_id,
                "clubId": club_id,
                **{field: str(value) for field, value in stat.items()},
            }
            for (season_id, competition_id, club_id), stat in sorted(grouped.items(), reverse=True)
        ]

    def get_player_stats(self) -> dict:
        """
        Retrieve and parse player statistics data for the specified player from Transfermarkt.

        Returns:
            dict: A dictionary containing the player's unique identifier, parsed player statistics, and the timestamp of
            when the data was last updated.
        """
        self.response["id"] = self.player_id
        self.response["stats"] = self.__parse_player_stats()

        return self.response
