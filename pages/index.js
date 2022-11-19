import Head from "next/head";
import { useEffect, useState } from "react";
import { Container, Row, Col, Form } from "react-bootstrap";
import BubbleChart from "../components/BubbleChart/BubbleChart";
import { useRouter } from "next/router";
import { csv, autoType, extent, max, min, groups, rollups } from "d3";
import RangeInput from "../components/RangeInput/RangeInput";
import classNames from "classnames";
import sources from "../public/data/sources.json";
import { BsHandIndexThumb } from "react-icons/bs";
export default function Home() {
	const { basePath } = useRouter();
	const [fullData, setFullData] = useState();
	const [data, setData] = useState();
	const [selectedContinents, setSelectedContinents] = useState();
	const [selectedYear, setSelectedYear] = useState();
	const [selectedEntities, setSelectedEntities] = useState([]);
	const [horizontalScale, setHorizontalScale] = useState("linear");

	// Load data ant initialize states
	useEffect(() => {
		const requests = [
			csv(basePath + "/data/population.csv", autoType),
			csv(basePath + "/data/life-expectancy.csv", autoType),
			csv(basePath + "/data/gdp-per-capita-maddison-2020.csv", autoType),
			csv(basePath + "/data/continents-according-to-our-world-in-data.csv", autoType),
		];
		Promise.all(requests).then((results) => {
			// time extent
			const timeExtent = [1810, 2018]; // Hans Rosling's values
			// relevant data
			const datasets = results.map((dataset) =>
				dataset.filter(
					(d) => d["Code"] && d["Code"] !== "OWID_WRL" && d["Year"] >= timeExtent[0] && d["Year"] <= timeExtent[1]
				)
			);
			// other extents
			const continents = groups(datasets[3], (d) => d["Continent"])
				.map((d) => d[0])
				.filter((d) => d !== "Antarctica");
			const populationExtent = extent(datasets[0], (d) => d["Population (historical estimates)"]);
			const lifeExtent = [25, 85]; // similar to Hans Rosling's values
			const gdpExtent = extent(datasets[2], (d) => d["GDP per capita"]); // similar to Hans Rosling's values

			const histories = rollups(
				datasets[0],
				(v) => {
					const life = datasets[1].filter((r) => r["Entity"] === v[0]["Entity"]);
					const gdp = datasets[2].filter((r) => r["Entity"] === v[0]["Entity"]);
					const continent = datasets[3].find((r) => r["Entity"] === v[0]["Entity"])["Continent"];
					return v.map((d) => ({
						year: d["Year"],
						continent,
						lifeExpectancy: life.find((l) => l["Year"] === d["Year"])?.["Life expectancy"],
						gdp: gdp.find((g) => g["Year"] === d["Year"])?.["GDP per capita"],
					}));
				},
				(d) => d["Entity"]
			);

			setFullData({
				datasets,
				histories,
				extents: { populationExtent, timeExtent, lifeExtent, gdpExtent, continents },
			});
			setSelectedYear(timeExtent[1]);
			setSelectedContinents(continents.map((d) => ({ label: d, active: true })));
		});
	}, []);

	// handle selections and parameters changes
	useEffect(() => {
		if (fullData && selectedYear) {
			// only selected continents
			const continents = selectedContinents.filter((d) => d.active).map((d) => d.label);
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
			// remove countries with missing values or not in selectedContinents
			dataset = dataset.filter((d) => d.lifeExpectancy && d.gdp && continents.indexOf(d.continent) > -1);
			// sort data to have smaller elements in the foreground
			dataset = dataset.sort((a, b) => b["Population (historical estimates)"] - a["Population (historical estimates)"]);

			// new GDP extent
			const availableCountries = dataset.map((d) => d["Entity"]);
			const filteredGdpData = fullData.datasets[2].filter((d) => availableCountries.indexOf(d["Entity"]) > -1);
			const newGdpExtent = extent(filteredGdpData, (d) => d["GDP per capita"]); // similar to Hans Rosling's values

			const extents = {
				...fullData.extents,
				gdpExtent: newGdpExtent,
				continents,
			};
			setData({ dataset, histories: fullData.histories, extents: { ...extents }, horizontalScale });
		}
	}, [fullData, selectedYear, selectedContinents, horizontalScale]);

	const handleContinentsSelection = (selection) => {
		selection.active = !selection.active;
		const _selectedContinents = [...selectedContinents];
		_selectedContinents.find((c) => c.label === selection.label).active = selection.active;
		setSelectedContinents(_selectedContinents);
		setSelectedEntities([]);
	};

	return (
		<>
			<Head>
				<title>Human progress | Interactive bubble chart</title>
			</Head>
			<Container>
				<Row>
					<Col className="mb-2">
						<h1 className={classNames("fw-bolder", "mt-4", "mb-2")}>Human progress from 1810 to 2018</h1>
						<p>
							Every circle represents a country.
							<br />
							<BsHandIndexThumb /> Click to see historical evolution of their wealth.
						</p>
					</Col>
				</Row>
				{data && (
					<>
						<Row className="mb-4">
							<Col md="4" className="d-flex flex-wrap">
								<h6 className="me-3 d-block fw-bold">Selected Continents</h6>
								<div className="d-flex flex-wrap flex-row">
									{selectedContinents.map((d) => (
										<Form.Check
											key={d.label}
											className="me-3"
											type="checkbox"
											id={`continent-${d.label}`}
											label={`${d.label}`}
											defaultChecked={d.active}
											disabled={selectedContinents.filter((d) => d.active).length === 1 && d.active}
											onChange={() => handleContinentsSelection(d)}
										/>
									))}
								</div>
							</Col>
							<Col md="4" className="mb-3">
								<h6 className="me-3 d-block fw-bold">Selected Year: {selectedYear}</h6>
								<RangeInput extent={data.extents.timeExtent} value={selectedYear} setValue={setSelectedYear} />
							</Col>
							<Col md="4" className="d-flex flex-wrap flex-column">
								<h6 className="me-3 d-block fw-bold">Horizontal scale</h6>
								<div className="d-flex flex-row">
									{["linear", "log"].map((d) => (
										<Form.Check
											key={d}
											className="me-3"
											label={d}
											name="horizontalScaleRadio"
											type="radio"
											id={`x-scale-switch`}
											defaultChecked={d === horizontalScale}
											onChange={() => setHorizontalScale(d)}
										/>
									))}
								</div>
							</Col>
						</Row>
						<Row className="mb-3">
							<Col className="" style={{ height: "70vh" }}>
								<BubbleChart
									data={data}
									selectedYear={selectedYear}
									selectedEntities={selectedEntities}
									setSelectedEntities={setSelectedEntities}
								/>
							</Col>
						</Row>
						<Row>
							<Col>
								<h4>Data sources</h4>
								<ul className="mb-3">
									{sources.map((source) => (
										<li key={source.label}>
											<p className="mb-0">
												<span className="fw-bold">{source.label}</span>: {source.description}{" "}
												<a href={source.url}>(link)</a>
											</p>
										</li>
									))}
								</ul>

								<h4>Roadmap</h4>
								<ul className="mb-3">
									<li>Animate the visualization year by year (use d3.timer())</li>
									<li>
										Semantic zoom to better distinguish elements (explained{" "}
										<a href="https://observablehq.com/@john-guerra/svg-semantic-zoom">here</a>)
									</li>
									<li>Use a searchbox to select countries</li>
									<li>Improve the visual and UI design (typeface, color palette, ui appearence)</li>
									<li>Add alert on mobile to invite visiting with a bigger screen.</li>
									<li>Bug hunting</li>
								</ul>
								<p className="fst-italic">Data Visualization Challenge for Our World in Data. November 2022</p>
							</Col>
						</Row>
					</>
				)}
			</Container>
		</>
	);
}
