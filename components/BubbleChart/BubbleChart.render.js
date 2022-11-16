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
} from "d3";
const x = scaleLinear().clamp(true),
	y = scaleLinear().clamp(true),
	r = scaleSqrt(),
	fillColor = scaleOrdinal();
let svg, bubble, stroke, label, historyLine;
let width,
	height,
	margin = { top: 50, right: 50, bottom: 50, left: 50 };

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
	historyLine = svg.select(".bubbles").append("path").attr("class", ".historyLine").attr("fill", "none");
	bubble = svg.select(".bubbles").selectAll(".bubble");
	stroke = svg.select(".bubbles").selectAll(".stroke");
	label = svg.select(".bubbles").selectAll(".label");
}

export function update(data) {
	// data.dataset = data.dataset.filter(d=>d["Entity"] === "Afghanistan")
	// console.log("update");
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
	const t = svg.transition().duration(750);
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
					.attr("fill", (d) => fillColor(d.continent))
					.on("mouseover", (event, d) => {
						const history = data.histories.find((dd) => dd[0] === d["Entity"])[1];
						historyLine
							.attr("d", valueline(history))
							.attr("stroke", (dd) => fillColor(d.continent))
							.style("opacity", 0)
							.transition()
							.duration(750)
							.style("opacity", 1);
						label.filter((dd) => dd["Entity"] === d["Entity"]).style("display", "block");
					})
					.on("mouseleave", (event, d) => {
						historyLine.attr("d", null).transition().duration(750).style("opacity", 0);
						label
							.style("display", (d, i) => (i < 10 ? "block" : "none"));
					})
					.call((enter) => enter.transition(t).attr("r", (d) => r(d["Population (historical estimates)"]))),
			(update) =>
				update
					.attr("cx", (d) => x(d.gdp))
					.attr("cy", (d) => y(d.lifeExpectancy))
					.attr("r", (d) => r(d["Population (historical estimates)"])),
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
					.attr("stroke", "white")
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
