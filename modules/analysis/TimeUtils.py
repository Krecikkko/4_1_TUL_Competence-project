from datetime import datetime, timedelta, timezone


class TimeUtils:

    @staticmethod
    def parse(time_str: str) -> datetime:
        return datetime.fromisoformat(time_str.replace("Z", "+00:00"))

    @staticmethod
    def add(time: datetime, seconds: float = 0, milliseconds: float = 0) -> datetime:
        return time + timedelta(seconds=seconds, milliseconds=milliseconds)

    @staticmethod
    def is_older(time1: datetime, time2: datetime) -> bool:
        return time1 < time2

    @staticmethod
    def to_string(time: datetime) -> str:
        return time.astimezone(timezone.utc).isoformat(timespec="seconds" if time.microsecond == 0 else "milliseconds").replace("+00:00", "Z")