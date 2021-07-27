import React from "react";
import Button from "@material-ui/core/Button";
import Box from "@material-ui/core/Box";
import OpenInBrowserIcon from "@material-ui/icons/OpenInBrowser";

function FileUploadButton(props) {
	let fileReader = null;

	const handleFileRead = (e) => {
		const content = fileReader.result;
		if (props.onRead) props.onRead(content);
	};

	const handleFileBuffer = (e) => {
		const content = fileReader.result;
		if (props.onBuffer) props.onBuffer(content);
	};

	function handleChange(e) {
		const { target } = e;
		if (target.value.length > 0) {
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
			console.log("File cancelled");
		}
		target.value = "";
	}

	return (
		<Box component="div" display="inline" mr={2}>
			<Button
				variant="contained"
				component="label"
				startIcon={<OpenInBrowserIcon />}
			>
				{props.label}
				<input
					type="file"
					accept={props.accept}
					onChange={handleChange}
					hidden
				/>
			</Button>
		</Box>
	);
}

export default FileUploadButton;
