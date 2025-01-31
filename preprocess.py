import json
result = [
    {
        "id":"hexcasting:open_paren",
        "start":"WEST",
        "angles":"qqq",
        "name":"Introspection",
        "modname":"Hex Casting"
    },
    {
        "id":"hexcasting:close_paren",
        "start":"EAST",
        "angles":"eee",
        "name":"Retrospection",
        "modname":"Hex Casting"
    },
    {
        "id":"hexcasting:escape",
        "start":"WEST",
        "angles":"qqqaw",
        "name":"Consideration",
        "modname":"Hex Casting"
    }
]
with open("registry_dump_raw.json") as f:
    result += json.load(f)
with open("registry_dump.json", "w") as f:
    json.dump(result, f)
