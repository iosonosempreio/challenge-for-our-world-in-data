import styles from "./BubbleChart.module.scss";
import classNames from "classnames";
import { init, update } from "./BubbleChart.render";
import { useRef, useEffect } from "react";
import { select } from "d3";
export default function BubbleChart({ data, selectedYear }) {
	const svgEl = useRef();
	useEffect(() => {
		init(select(svgEl.current));
	}, []);
	useEffect(() => {
		update(data, selectedYear)
	}, [data, selectedYear]);
	return (
		<svg ref={svgEl} className={classNames(styles.bubbleChartSVG)}>
			<g className="xAxis"/>
			<g className="yAxis"/>
			<g className="bubbles"/>
			{/* <text x="50%" y="50%" textAnchor="middle">
				{selectedYear}
			</text> */}
		</svg>
	);
}
