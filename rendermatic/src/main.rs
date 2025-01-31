use hex_renderer::{defaults::SEGMENT, grids::{GridDraw, HexGrid}, pattern_utils::{Angle, Direction}, Pattern};
use serde::{Deserialize, Serialize};

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
struct Entry {
    id: String,
    start: String,
    angles: String,
    name: String,
    modname: String,
}


fn main() {
    let dump: Vec<Entry> = serde_json::from_str(&std::fs::read_to_string("../registry_dump.json").unwrap()).unwrap();
    for entry in dump {
        let start = match entry.start.as_str() {
            "NORTH_EAST" => Direction::NorthEast,
            "NORTH_WEST" => Direction::NorthWest,
            "SOUTH_EAST" => Direction::SouthEast,
            "SOUTH_WEST" => Direction::SouthWest,
            "EAST" => Direction::East,
            "WEST" => Direction::West,
            _ => unreachable!()
        };
        let angles: Vec<_> = entry.angles.chars().map(|angle| match angle {
            'w' => Angle::Forward,
            'e' => Angle::Right,
            'd' => Angle::BackRight,
            's' => Angle::Back,
            'a' => Angle::BackLeft,
            'q' => Angle::Left,
            _ => unreachable!()
        }).collect();
        let pattern = Pattern::new(start, angles);
        let hex_grid = HexGrid::new_normal(vec![pattern], 100000).unwrap();
        let scale = 50.0;
        let drawn = hex_grid.draw_grid(scale, &SEGMENT).unwrap();
        println!("{},{},{}", entry.id, drawn.width(), drawn.height());
        drawn.save_png(format!("../images/patterns/hexxytest3/{}.png", entry.id.replace([':', '/'], "_"))).unwrap();
    }
}
