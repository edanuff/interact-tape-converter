import React from "react";
import MenuItem from "@material-ui/core/MenuItem";
import { useState } from "react";
import uniqueId from "lodash/uniqueId";

export default function FileUploadMenuItem(props) {
	let fileReader = null;
	let filename = null;

	const [id] = useState(uniqueId("file-prefix-"));

	const handleFileRead = (e) => {
		const content = fileReader.result;
		if (props.onRead) props.onRead(content, filename);
	};

	const handleFileBuffer = (e) => {
		const content = fileReader.result;
		if (props.onBuffer) props.onBuffer(content, filename);
	};

	function handleChange(e) {
		const { target } = e;
		if (target.value.length > 0) {
			filename = target.files[0].name;
			if (props.onFile) {
				props.onFile(target.files[0]);
			} else {
				fileReader = new FileReader();
				if (props.onRead) {
					fileReader.onloadend = handleFileRead;
					fileReader.readAsText(target.files[0]);
				}
				else {
					fileReader.onloadend = handleFileBuffer;
					fileReader.readAsArrayBuffer(target.files[0]);
				}
			}
		} else {
			console.log("FileUploadMenuItem: File cancelled");
		}
		target.value = "";
		//if (props.onClick) props.onClick(e);
	}

	return (
		<MenuItem onClick={props.onClick}>
			<label htmlFor={id}>{props.children}</label>
			<input
				id={id}
				type="file"
				accept={props.accept}
				onChange={handleChange}
				hidden
			/>
		</MenuItem>
	);
}
