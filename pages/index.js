import Head from "next/head";
import { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import BubbleChart from "../components/BubbleChart/BubbleChart";
import { useRouter } from "next/router";
import { csv, autoType, extent, max, min, groups, rollups } from "d3";
import RangeInput from "../components/RangeInput/RangeInput";
export default function Home() {
	const { basePath } = useRouter();
	const [fullData, setFullData] = useState();
	const [data, setData] = useState();
	const [selectedYear, setSelectedYear] = useState();
	useEffect(() => {
		const requests = [
			csv(basePath + "/data/population.csv", autoType),
			csv(basePath + "/data/life-expectancy.csv", autoType),
			csv(basePath + "/data/gdp-per-capita-maddison-2020.csv", autoType),
			csv(basePath + "/data/continents-according-to-our-world-in-data.csv", autoType),
		];
		Promise.all(requests).then((results) => {
			// calculate YEARS extents
			const yearsExtents = results.map((dataset) => extent(dataset, (d) => d["Year"]));
			// const timeExtent = [max(yearsExtents.map((d) => d[0])), min(yearsExtents.map((d) => d[1]))];
			const timeExtent = [1810, 2018]; // Hans Rosling's values
			const populationExtent = extent(results[0], (d) => d["Population (historical estimates)"]);
			// const lifeExtent = extent(results[1], (d) => d["Life expectancy"]);
			const lifeExtent = [35, 90]; // similar to Hans Rosling's values
			const continents = groups(results[3], (d) => d["Continent"]).map((d) => d[0]);
			// const gdpExtent = extent(results[2], (d) => d["GDP per capita"]);
			const gdpExtent = [0, 80000]; // similar to Hans Rosling's values
			// relevant data
			const datasets = results.map((dataset) =>
				dataset.filter((d) => d["Code"] !== "OWID_WRL" && d["Year"] >= timeExtent[0] && d["Year"] <= timeExtent[1])
			);
			setFullData({ datasets, extents: { populationExtent, timeExtent, lifeExtent, gdpExtent, continents } });
			setSelectedYear(timeExtent[0]);
		});
	}, []);

	useEffect(() => {
		if (fullData && selectedYear) {
			// countries and population in selected year
			let dataset = rollups(
				fullData.datasets[0],
				(v) => v.find((vv) => vv["Year"] == selectedYear),
				(d) => d["Entity"]
			);
			// remove countries with no population for current year
			dataset = dataset.filter((d) => d[1]);
			// appen data of life expectation, gdp, and country continent
			dataset = dataset.map((d) => {
				const datum = d[1];
				const continentRecord = fullData.datasets[3].find((record) => record["Entity"] === datum["Entity"]);
				if (continentRecord) datum.continent = continentRecord["Continent"];
				const lifeExpectancyRecord = fullData.datasets[1].find(
					(record) => record["Entity"] === datum["Entity"] && record["Year"] == selectedYear
				);
				if (lifeExpectancyRecord) datum.lifeExpectancy = lifeExpectancyRecord["Life expectancy"];
				const gdpRecord = fullData.datasets[2].find(
					(record) => record["Entity"] === datum["Entity"] && record["Year"] == selectedYear
				);
				if (gdpRecord) datum.gdp = gdpRecord["GDP per capita"];
				return datum;
			});
			// remove countries with missing values
			dataset = dataset.filter((d) => d.lifeExpectancy && d.gdp);
			dataset = dataset.sort((a, b) => b["Population (historical estimates)"] - a["Population (historical estimates)"]);
			setData({ dataset, extents: { ...fullData.extents } });
		}
	}, [fullData, selectedYear]);

	return (
		<>
			<Head>
				<title>Human progress | Interactive bubble chart</title>
			</Head>
			<Container>
				<Row>
					<Col>
						<h1>Interactive bubble chart of human progress</h1>
					</Col>
				</Row>
				{data && (
					<>
						<Row>
							<RangeInput extent={data.extents.timeExtent} value={selectedYear} setValue={setSelectedYear} />
						</Row>
						<Row>
							<Col style={{ height: "70vh" }}>
								<BubbleChart data={data} selectedYear={selectedYear} />
							</Col>
						</Row>
					</>
				)}
			</Container>
		</>
	);
}
