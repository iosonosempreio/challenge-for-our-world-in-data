import styles from "./RangeInput.module.scss";
import { Form } from "react-bootstrap";
export default function RangeInput({ extent, value, setValue }) {
	return (
		<>
			<Form.Range onChange={(e) => setValue(e.target.value)} min={extent[0]} max={extent[1]} defaultValue={value} />
			{/* <Form.Label>Selected year: {value}</Form.Label> */}
		</>
	);
}
