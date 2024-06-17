import {Bounds, Coordinate} from "../../webtools/types.ts";

export function onWorldviewChange(newWorldview: Bounds, updateService) {
    updateService.setBounds(newWorldview)
    // console.log("onWorldviewChange", newWorldview)
}

export function onCellHover(coordinate: Coordinate) {
    // console.log("onCellHover", coordinate)
}

export function onCellClick(coordinate: Coordinate) {
    console.log("onCellClick", coordinate)
}
export function onColorSelect(color: string) {
    console.log("onColorSelect", color)
}
export function onZoomChange(newZoom: number, setViewportZoom) {
    console.log("onZoomChange", newZoom)
    setViewportZoom(newZoom)
}