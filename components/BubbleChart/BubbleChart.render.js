import {
	axisLeft,
	axisBottom,
	line,
	rollups,
	selectAll,
	scaleLinear,
	scaleSqrt,
	scaleOrdinal,
	curveCardinal,
	color,
} from "d3";
const x = scaleLinear().clamp(true),
	y = scaleLinear().clamp(true),
	r = scaleSqrt(),
	fillColor = scaleOrdinal();
let svg, bubble, stroke, label, historyLine;
let width,
	height,
	margin = { top: 50, right: 50, bottom: 50, left: 50 };

let selectedCountries = [];

const valueline = line()
	.defined((d) => d.gdp && d.lifeExpectancy)
	.curve(curveCardinal)
	.x((d) => x(d.gdp))
	.y((d) => y(d.lifeExpectancy));

export function init(selection) {
	console.log("init");
	svg = selection;
	const bbox = svg.node().getBoundingClientRect();
	width = bbox.width; // - margin.left - margin.right;
	height = bbox.height; // - margin.top - margin.bottom;
	svg.select(".bubbles").selectAll("*").remove();
	historyLine = svg.select(".bubbles").selectAll(".historyLine");
	bubble = svg.select(".bubbles").selectAll(".bubble");
	stroke = svg.select(".bubbles").selectAll(".stroke");
	label = svg.select(".bubbles").selectAll(".label");
}

let _data;

export function update(data) {
	_data = data;
	// console.log("update", data);
	x.domain(data.extents.gdpExtent).range([margin.left, width - margin.right]);
	y.domain(data.extents.lifeExtent).range([height - margin.bottom, margin.top]);
	r.domain([0, data.extents.populationExtent[1]]).range([2, 100]);
	fillColor
		.domain(data.extents.continents)
		.range(["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f", "#e5c494", "#b3b3b3"]);
	svg
		.select(".xAxis")
		.attr("transform", `translate(0,${height - margin.bottom})`)
		.call(axisBottom(x));
	svg.select(".yAxis").attr("transform", `translate(${margin.left},0)`).call(axisLeft(y));
	svg
		.selectAll(".xAxisLabel")
		.data(["GDP per capita"])
		.join("text")
		.attr("class", "xAxisLabel")
		.attr("text-anchor", "middle")
		.attr("transform", `translate(${width / 2}, ${height - margin.bottom / 3})`)
		.attr("fill", "black")
		.attr("font-size", 12)
		.text((d) => d);
	svg
		.selectAll(".yAxisLabel")
		.data(["Life Expectancy"])
		.join("text")
		.attr("class", "yAxisLabel")
		.attr("text-anchor", "middle")
		.attr("transform", `translate(${margin.left / 3 - 3},${height / 2}) rotate(90)`)
		.attr("fill", "black")
		.attr("font-size", 12)
		.text((d) => d);
	const t = svg.transition().duration(750);

	historyLine = historyLine
		.data(
			data.histories.filter((d) => selectedCountries.indexOf(d[0]) > -1),
			(d) => d[0]
		)
		.join(
			(enter) =>
				enter
					.append("path")
					.attr("d", (d) => valueline(d[1]))
					.attr("fill", "none")
					.attr("stroke", (d) => {
						const entity = data.dataset.find((dd) => dd["Entity"] === d[0]);
						return fillColor(entity.continent);
					})
					.lower(),
			(update) => update.attr("d", (d) => valueline(d[1])),
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
					.attr("fill", (d) => {
						if (selectedCountries.length > 0) {
							const index = selectedCountries.indexOf(d["Entity"]);
							if (index > -1) {
								return fillColor(d.continent);
							} else {
								return "transparent";
							}
						} else {
							return fillColor(d.continent);
						}
					})
					.on("mouseover", (event, d) => {
						label.filter((dd) => dd["Entity"] === d["Entity"]).style("display", "block");
					})
					.on("mouseleave", (event, d) => {
						label.style("display", (d, i) => (i < 10 ? "block" : "none"));
					})
					.on("click", (event, dd) => {
						const entity = dd["Entity"];
						const index = selectedCountries.indexOf(entity);
						if (index < 0) {
							selectedCountries.push(entity);
						} else {
							selectedCountries.splice(index, 1);
						}
						update(_data);
					})
					.call((enter) => enter.transition(t).attr("r", (d) => r(d["Population (historical estimates)"]))),
			(update) =>
				update
					.attr("cx", (d) => x(d.gdp))
					.attr("cy", (d) => y(d.lifeExpectancy))
					.attr("r", (d) => r(d["Population (historical estimates)"]))
					.attr("fill", (d) => {
						if (selectedCountries.length > 0) {
							const index = selectedCountries.indexOf(d["Entity"]);
							if (index > -1) {
								return fillColor(d.continent);
							} else {
								return "transparent";
							}
						} else {
							return fillColor(d.continent);
						}
					}),
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
					.attr("stroke", (d) => color(fillColor(d.continent)).brighter(0.5))
					.style("opacity", 0.5)
					.call((enter) => enter.transition(t).attr("r", (d) => r(d["Population (historical estimates)"]))),
			(update) =>
				update
					.attr("cx", (d) => x(d.gdp))
					.attr("cy", (d) => y(d.lifeExpectancy))
					.attr("r", (d) => r(d["Population (historical estimates)"])),
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
					.attr("y", (d) => y(d.lifeExpectancy) - r(d["Population (historical estimates)"]))
					.attr("fill", "#444")
					.attr("font-size", 12)
					.attr("text-anchor", "middle")
					.style("opacity", 0)
					.text((d) => d["Entity"])
					.style("pointer-events", "none")
					.style("display", (d, i) => (i < 10 ? "block" : "none"))
					.call((enter) => enter.transition(t).style("opacity", 1)),
			(update) =>
				update
					.attr("x", (d) => x(d.gdp))
					.attr("y", (d) => y(d.lifeExpectancy) - r(d["Population (historical estimates)"]))
					.style("display", (d, i) => (i < 10 ? "block" : "none"))
					.raise(),
			(exit) => exit.call((exit) => exit.transition(t).style("opacity", 0).remove())
		);
}
