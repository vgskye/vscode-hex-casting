import json
converted = {
    "Bookkeeper's Gambit": {
        "name": "mask",
        "modid": "hexcasting",
        "modName": "Hex Casting",
        "image": None,
        "direction": None,
        "pattern": None,
        "args": None,
        "url": None,
        "description": None
    },
    "Numerical Reflection": {
        "name": "number",
        "modid": "hexcasting",
        "modName": "Hex Casting",
        "image": None,
        "direction": None,
        "pattern": None,
        "args": None,
        "url": None,
        "description": None
    }
}
images = {}
with open("rendermatic.csv") as f:
    for entry in map(str.strip, f.readlines()):
        name, w, h = entry.split(",")
        images[name] = {
            "filename": name.replace(":", "_").replace("/", "_") + ".png",
            "height": int(h),
            "width": int(w),
        }
with open("registry_dump.json") as f:
    for entry in json.load(f):
        converted[entry["name"]] = {
            "name": entry["id"].split(":")[1],
            "modid": entry["id"].split(":")[0],
            "modName": entry["modname"],
            "image": images[entry["id"]],
            "direction": entry["start"],
            "pattern": entry["angles"],
            "args": None,
            "url": None,
            "description": None,
        }
with open("src/data/registry_hexxytest3.json", "w") as f:
    json.dump(converted, f)
