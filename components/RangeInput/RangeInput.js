import styles from "./RangeInput.module.scss";
import { Form } from "react-bootstrap";
export default function RangeInput({ extent, value, setValue }) {
	return (
		<>
			<Form.Label>Selected year: {value}</Form.Label>
			<Form.Range onChange={(e) => setValue(e.target.value)} min={extent[0]} max={extent[1]} defaultValue={value} />
		</>
	);
}
