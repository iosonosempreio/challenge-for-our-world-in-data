import {
	axisLeft,
	axisBottom,
	line,
	rollups,
	scaleLinear,
	scaleLog,
	scaleSqrt,
	scaleOrdinal,
	curveCardinal,
	color,
	format,
	select,
} from "d3";
const y = scaleLinear().clamp(true),
	r = scaleSqrt(),
	f = format(".2s"),
	fillColor = {
		Asia: "#66c2a5",
		Europe: "#fc8d62",
		Africa: "#8da0cb",
		Oceania: "#e78ac3",
		"North America": "#a6d854",
		Antarctica: "#ffd92f",
		"South America": "#e5c494",
	};
let svg,
	bubble,
	stroke,
	label,
	historyLineBg,
	historyLine,
	year,
	legend,
	reset,
	hoverX,
	hoverY,
	x = scaleLog().clamp(true);
let width,
	height,
	m = 50,
	margin = { top: m, right: m, bottom: m, left: m };

const valueline = line()
	.defined((d) => d.gdp && d.lifeExpectancy)
	.curve(curveCardinal)
	.x((d) => x(d.gdp))
	.y((d) => y(d.lifeExpectancy));

export function init(selection, setSelectedEntities) {
	console.log("init", selection, setSelectedEntities);
	svg = selection;
	const bbox = svg.node().getBoundingClientRect();
	width = bbox.width; // - margin.left - margin.right;
	height = bbox.height; // - margin.top - margin.bottom;
	svg.select(".bubbles").selectAll("*").remove();
	reset = svg.select(".bubbles").append("g");
	historyLineBg = svg.select(".bubbles").selectAll(".historyLineBg");
	historyLine = svg.select(".bubbles").selectAll(".historyLine");
	year = svg.select(".bubbles").selectAll(".year");
	bubble = svg.select(".bubbles").selectAll(".bubble");
	stroke = svg.select(".bubbles").selectAll(".stroke");
	label = svg.select(".bubbles").selectAll(".label");
	legend = svg.select(".bubbles").append("g").attr("class", "legend");

	hoverX = svg.select(".bubbles").append("g").classed("hover-x", true);
	hoverX.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 6).attr("stroke", "black");
	hoverX
		.append("text")
		.attr("x", 0)
		.attr("y", 16)
		.attr("stroke", "white")
		.attr("stroke-width", 3)
		.attr("text-anchor", "middle")
		.attr("font-size", "12")
		.attr("font-weight", "bold");
	hoverX
		.append("text")
		.attr("x", 0)
		.attr("y", 16)
		.attr("fill", "black")
		.attr("text-anchor", "middle")
		.attr("font-size", "12")
		.attr("font-weight", "bold");
	hoverY = svg.select(".bubbles").append("g").attr("fill", "black").classed("hover-y", true);
	hoverY.append("line").attr("x1", 0).attr("y1", 0).attr("x2", -6).attr("y2", 0).attr("stroke", "black");
	hoverY
		.append("text")
		.attr("x", -8)
		.attr("y", 4)
		.attr("stroke", "white")
		.attr("stroke-width", 3)
		.attr("text-anchor", "end")
		.attr("font-size", "12")
		.attr("font-weight", "bold");
	hoverY
		.append("text")
		.attr("x", -8)
		.attr("y", 4)
		.attr("fill", "black")
		.attr("text-anchor", "end")
		.attr("font-size", "12")
		.attr("font-weight", "bold");
}

export function update(data, selectedEntities, setSelectedEntities) {
	const selectedHistories = data.histories.filter((d) => selectedEntities.indexOf(d[0]) > -1);
	// console.log("update", data, selectedEntities);
	if (data.horizontalScale === "linear") {
		x = scaleLinear().clamp(true);
	} else {
		x = scaleLog().clamp(true);
	}
	reset.selectAll("*").remove();
	reset
		.append("rect")
		.attr("class", "reset-selection")
		.attr("width", width)
		.attr("height", height)
		.attr("fill", "transparent");
	reset
		.append("text")
		.attr("x", width - margin.right)
		.attr("y", margin.top / 2)
		.attr("text-anchor", "end")
		.attr("font-size", 12)
		.attr("fill", "#999")
		.attr("display", selectedEntities.length > 0 ? "block" : "none")
		.text("Click ont the background to reset the selection");
	reset.on("click", () => setSelectedEntities([]));
	x.domain(data.extents.gdpExtent).range([margin.left, width - margin.right]);
	y.domain(data.extents.lifeExtent).range([height - margin.bottom, margin.top]);
	r.domain([0, data.extents.populationExtent[1]]).range([3, m]);
	svg
		.select(".xAxis")
		.attr("transform", `translate(0,${height - margin.bottom})`)
		.call(axisBottom(x));
	svg.select(".yAxis").attr("transform", `translate(${margin.left},0)`).call(axisLeft(y));
	svg
		.selectAll(".xAxisLabel")
		.data(["GDP per capita ($)"])
		.join("text")
		.attr("class", "xAxisLabel")
		.attr("text-anchor", "middle")
		.attr("transform", `translate(${width / 2}, ${height - margin.bottom / 4})`)
		.attr("fill", "black")
		.attr("font-weight", 600)
		.attr("font-size", 12)
		.text((d) => d);
	svg
		.selectAll(".yAxisLabel")
		.data(["Life Expectancy (years)"])
		.join("text")
		.attr("class", "yAxisLabel")
		.attr("text-anchor", "middle")
		.attr("transform", `translate(${margin.left / 4 - 3},${height / 2}) rotate(90)`)
		.attr("fill", "black")
		.attr("font-weight", 600)
		.attr("font-size", 12)
		.text((d) => d);
	const t = svg.transition().duration(750);

	historyLineBg = historyLineBg
		.data(
			() => {
				const grouped = rollups(
					selectedHistories,
					(v) => v[0][1],
					(d) => d[0]
				);
				return grouped;
			},
			(d) => d[0]
		)
		.join(
			(enter) =>
				enter
					.append("path")
					.attr("class", "historyLineBg")
					.attr("d", (d) => valueline(d[1].filter((dd) => dd.lifeExpectancy && dd.gdp)))
					.attr("fill", "none")
					.attr("stroke", "#999")
					.attr("stroke-dasharray", "1 3"),
			(update) => update.attr("d", (d) => valueline(d[1])),
			(exit) => exit.remove()
		);

	historyLine = historyLine
		.data(
			() => {
				const grouped = rollups(
					selectedHistories,
					(v) => v[0][1],
					(d) => d[0]
				);
				return grouped;
			},
			(d) => d[0]
		)
		.join(
			(enter) =>
				enter
					.append("path")
					.attr("class", "historyLine")
					.attr("d", (d) => valueline(d[1]))
					.attr("fill", "none")
					.attr("stroke-width", 1.5)
					.attr("stroke", (d) => {
						const entity = data.dataset.find((dd) => dd["Entity"] === d[0]);
						return color(fillColor[entity.continent]).brighter(0.25);
					}),
			(update) => update.attr("d", (d) => valueline(d[1])),
			(exit) => exit.remove()
		);

	year = year
		.data(
			() => {
				const grouped = rollups(
					selectedHistories,
					(v) => v[0][1],
					(d) => d[0]
				);
				return grouped;
			},
			(d) => d[0]
		)
		.join(
			(enter) => enter.append("g"),
			(update) => update,
			(exit) => exit.remove()
		);

	year
		.selectAll("circle")
		.data((d) => d[1].filter((dd) => dd.lifeExpectancy && dd.gdp))
		.join(
			(enter) =>
				enter
					.append("circle")
					.attr("cx", (d) => x(d.gdp))
					.attr("cy", (d) => y(d.lifeExpectancy))
					.attr("fill", (d) => fillColor[d.continent])
					.attr("stroke", "transparent")
					.attr("stroke-width", 2)
					.attr("r", 2.5)
					.style("cursor", "pointer")
					.on("mouseover", (event, d) => {
						svg
							.append("text")
							.attr("id", "yearLabel")
							.attr("x", 500)
							.attr("y", 500)
							.attr("x", x(d.gdp))
							.attr("y", y(d.lifeExpectancy))
							.attr("font-size", 10)
							.style("pointer-events", "none")
							.text(d.year);
					})
					.on("mouseleave", () => {
						svg.select("#yearLabel").remove();
					}),
			(update) =>
				update
					.attr("cx", (d) => x(d.gdp))
					.attr("cy", (d) => y(d.lifeExpectancy))
					.on("mouseover", (event, d) => {
						svg
							.append("text")
							.attr("id", "yearLabel")
							.attr("x", 500)
							.attr("y", 500)
							.attr("x", x(d.gdp))
							.attr("y", y(d.lifeExpectancy))
							.attr("font-size", 10)
							.style("pointer-events", "none")
							.text(d.year);
					})
					.on("mouseleave", () => {
						svg.select("#yearLabel").remove();
					}),
			(exit) => exit.remove()
		);

	bubble = bubble
		.data(data.dataset, (d) => d["Code"])
		.join(
			(enter) =>
				enter
					.append("circle")
					.attr("class", "bubble")
					.attr("data-code", (d) => d["Code"])
					.attr("r", (d) => 0)
					.attr("cx", (d) => x(d.gdp))
					.attr("cy", (d) => y(d.lifeExpectancy))
					.style("cursor", "pointer")
					.attr("fill", (d) => {
						if (selectedEntities.length > 0) {
							const index = selectedEntities.indexOf(d["Entity"]);
							if (index > -1) {
								return fillColor[d.continent];
							} else {
								return "transparent";
							}
						} else {
							return fillColor[d.continent];
						}
					})
					.on("mouseover", (event, d) => {
						label.filter((dd) => dd["Entity"] === d["Entity"]).style("display", "block");
						handleHover(d);
						drawLegend(legend, data, d);
					})
					.on("mouseleave", (event, d) => {
						label.style("display", (d, i) => handleDisplay(d, i, selectedEntities));
						handleHover();
						drawLegend(legend, data);
					})
					.on("click", (event, d) => handleClick(d, selectedEntities, setSelectedEntities))
					.call((enter) => enter.transition(t).attr("r", (d) => r(d["Population (historical estimates)"]))),
			(update) =>
				update
					.attr("r", (d) => r(d["Population (historical estimates)"]))
					.attr("fill", (d) => {
						if (selectedEntities.length > 0) {
							const index = selectedEntities.indexOf(d["Entity"]);
							if (index > -1) {
								return fillColor[d.continent];
							} else {
								return "transparent";
							}
						} else {
							return fillColor[d.continent];
						}
					})
					.on("mouseover", (event, d) => {
						label.filter((dd) => dd["Entity"] === d["Entity"]).style("display", "block");
						handleHover(d);
						drawLegend(legend, data, d);
					})
					.on("mouseleave", (event, d) => {
						label.style("display", (d, i) => handleDisplay(d, i, selectedEntities));
						handleHover();
						drawLegend(legend, data);
					})
					.on("click", (event, d) => handleClick(d, selectedEntities, setSelectedEntities))
					.attr("cx", (d) => x(d.gdp))
					.attr("cy", (d) => y(d.lifeExpectancy)),
			(exit) => exit.call((exit) => exit.transition(t).style("opacity", 0).remove())
		);
	stroke = stroke
		.data(data.dataset, (d) => d["Code"])
		.join(
			(enter) =>
				enter
					.append("circle")
					.attr("class", "stroke")
					.attr("data-code", (d) => d["Code"])
					.attr("r", (d) => 0)
					.attr("cx", (d) => x(d.gdp))
					.attr("cy", (d) => y(d.lifeExpectancy))
					.attr("fill", "none")
					.attr("stroke", (d) => {
						if (selectedEntities.length > 0) {
							const index = selectedEntities.indexOf(d["Entity"]);
							if (index > -1) {
								return "white";
							} else {
								return fillColor[d.continent];
							}
						} else {
							return "white";
						}
					})
					.style("opacity", 0.5)
					.style("pointer-events", "none")
					.call((enter) => enter.transition(t).attr("r", (d) => r(d["Population (historical estimates)"]))),
			(update) =>
				update
					.attr("r", (d) => r(d["Population (historical estimates)"]))
					.attr("stroke", (d) => {
						if (selectedEntities.length > 0) {
							const index = selectedEntities.indexOf(d["Entity"]);
							if (index > -1) {
								return "white";
							} else {
								return fillColor[d.continent];
							}
						} else {
							return "white";
						}
					})
					.attr("cx", (d) => x(d.gdp))
					.attr("cy", (d) => y(d.lifeExpectancy)),
			(exit) => exit.call((exit) => exit.transition(t).style("opacity", 0).remove())
		);

	label = label
		.data(data.dataset, (d) => d["Code"])
		.join(
			(enter) =>
				enter
					.append("text")
					.attr("class", "label")
					.attr("data-code", (d) => d["Code"])
					.attr("x", (d) => x(d.gdp))
					.attr("y", (d) => y(d.lifeExpectancy) - r(d["Population (historical estimates)"]) - 3)
					.attr("fill", "#444")
					.attr("font-size", 12)
					.attr("text-anchor", "middle")
					.attr("font-weight", (d) => handleFontWeight(d, selectedEntities))
					.style("opacity", 0)
					.text((d) => d["Entity"])
					.style("pointer-events", "none")
					.style("display", (d, i) => handleDisplay(d, i, selectedEntities))
					.call((enter) => enter.transition(t).style("opacity", 1)),
			(update) =>
				update
					.attr("font-weight", (d) => handleFontWeight(d, selectedEntities))
					.style("display", (d, i) => handleDisplay(d, i, selectedEntities))
					.attr("x", (d) => x(d.gdp))
					.attr("y", (d) => y(d.lifeExpectancy) - r(d["Population (historical estimates)"]) - 3),
			(exit) => exit.call((exit) => exit.transition(t).style("opacity", 0).remove())
		);
	historyLine.lower();
	historyLineBg.lower();
	reset.lower();
	year.raise();
	bubble.raise();
	stroke.raise();
	label.raise();
	legend.raise();
	hoverX.raise();
	hoverY.raise();
	drawLegend(legend, data);
}

function handleDisplay(d, i, selection) {
	if (i < 10 || selection.indexOf(d["Entity"]) > -1) {
		return "block";
	} else {
		return "none";
	}
}

function handleFontWeight(d, selection) {
	if (selection.indexOf(d["Entity"]) > -1) {
		return 600;
	} else {
		return 400;
	}
}

function handleClick(d, selected, setSelected) {
	const entity = d["Entity"];
	const index = selected.indexOf(entity);
	if (index < 0) {
		setSelected((selected) => [...selected, entity]);
	} else {
		setSelected((selected) => [...selected.filter((s) => s !== entity)]);
	}
}

function handleHover(d) {
	if (d) {
		hoverX.attr("display", "block");
		hoverX.attr("transform", `translate(${x(d.gdp)}, ${y(y.domain()[0])})`);
		hoverX.selectAll("text").text(f(d.gdp));

		hoverY.attr("display", "block");
		hoverY.attr("transform", `translate(${x(x.domain()[0])}, ${y(d.lifeExpectancy)})`);
		hoverY.selectAll("text").text(f(d.lifeExpectancy));
	} else {
		hoverX.attr("display", "none");
		hoverY.attr("display", "none");
	}
}

function drawLegend(selection, data, hover) {
	const gutter = 25;
	const areasBBoxWidth = 135;
	selection.selectAll("*").remove();
	selection.append("text").attr("font-size", 12).attr("font-weight", "600").text("Countries Population");

	let area = selection
		.append("g")
		.attr("class", "areas")
		.selectAll(".area")
		.data(() => {
			if (hover) {
				return [data.extents.populationExtent[1], 100000, +hover["Population (historical estimates)"]];
			} else {
				return [data.extents.populationExtent[1], 100000];
			}
		})
		.join("g")
		.attr("class", "area")
		.attr(
			"transform",
			(d, i) => `translate(${r(data.extents.populationExtent[1])}, ${r(data.extents.populationExtent[1]) * 2 + 10})`
		);

	area
		.append("circle")
		.attr("r", (d) => r(d))
		.attr("fill", (d, i) => (i === 0 ? "white" : "transparent"))
		.attr("stroke", "black")
		.attr("cy", (d) => -r(d));

	area
		.append("text")
		.attr("y", (d) => -r(d) * 2 + 6)
		.attr("x", (d) => 5 + r(data.extents.populationExtent[1]))
		.attr("font-size", 12)
		.attr("stroke-width", 4)
		.attr("stroke", "white")
		.attr("font-weight", (d, i) => (i === 2 ? "bold" : "regular"))
		.text((d) => f(d).replace("G", "B"));

	area
		.append("text")
		.attr("y", (d) => -r(d) * 2 + 6)
		.attr("x", (d) => 5 + r(data.extents.populationExtent[1]))
		.attr("font-size", 12)
		.attr("font-weight", (d, i) => (i === 2 ? "bold" : "regular"))
		.text((d) => f(d).replace("G", "B"));

	const areasBBox = selection.select(".areas").node().getBBox();

	selection
		.append("text")
		.attr("font-size", 12)
		.attr("font-weight", "600")
		.attr("x", areasBBoxWidth + gutter)
		.text("Continents");

	let continent = selection
		.append("g")
		.attr("class", "continents")
		.selectAll(".continent")
		.data(data.extents.continents, (d, i) => i)
		.join("g")
		.attr("class", "continent")
		.attr("transform", (d, i) => `translate(${areasBBoxWidth + gutter}, ${i * 15 + 10})`);

	continent
		.append("rect")
		.attr("width", 10)
		.attr("height", 10)
		.attr("fill", (d) => fillColor[d]);

	continent
		.append("text")
		.attr("x", 15)
		.attr("y", 10)
		.attr("font-size", 12)
		.text((d) => d);

	const continentsBBox = selection.select(".continents").node().getBBox();

	selection
		.append("text")
		.attr("font-size", 12)
		.attr("font-weight", "600")
		.attr("x", areasBBoxWidth + gutter + continentsBBox.width + gutter)
		.text("Historical Data");

	selection
		.append("line")
		.attr("x1", 0)
		.attr("y1", 0)
		.attr("x2", 50)
		.attr("y2", 0)
		.attr("fill", "none")
		.attr("stroke", "#333")
		.attr("stroke-width", "1")
		.attr("transform", `translate(${areasBBoxWidth + gutter + continentsBBox.width + gutter}, ${0.5 * gutter})`);

	selection
		.append("text")
		.attr("font-size", 12)
		.attr("x", areasBBoxWidth + gutter + continentsBBox.width + gutter)
		.attr("y", 1.25 * gutter)
		.text("Evolution");

	selection
		.append("line")
		.attr("x1", 0)
		.attr("y1", 0)
		.attr("x2", 50)
		.attr("y2", 0)
		.attr("fill", "none")
		.attr("stroke", "#333")
		.attr("stroke-width", "1")
		.attr("stroke-dasharray", "1 3")
		.attr("transform", `translate(${areasBBoxWidth + gutter + continentsBBox.width + gutter}, ${2.5 * gutter})`);

	selection
		.append("text")
		.attr("font-size", 12)
		.attr("x", areasBBoxWidth + gutter + continentsBBox.width + gutter)
		.attr("y", 3.25 * gutter)
		.text("Gap in data");

	selection
		.append("text")
		.attr("font-size", 12)
		.attr("y", areasBBox.height + 1.5 * gutter)
		.text("Countries appear according to availability of data (year by year).");

	const legendBBox = selection.node().getBBox();
	legend.attr(
		"transform",
		`translate(${width - legendBBox.width - margin.right}, ${height - legendBBox.height - margin.bottom})`
	);

	legend;
}
