from datetime import datetime, timezone

def process_zip_progress_items(items):
    return list(map(lambda item: {
        "createdAt": item["createdAt"]["S"],
        "zipFileName": item["zipFileName"]["S"],
        "folder": item["folder"]["S"],
        "updatedAt": item["updatedAt"]["S"],
        "progress": item["progress"]["S"] if item["progress"]["S"] == "Finalized" or item["progress"]["S"] == "Failed" or (datetime.now(timezone.utc) - datetime.fromisoformat(item["createdAt"]["S"].replace('Z', '+00:00'))).total_seconds() < 16*60 else "Failed",
    }, items))