import React from "react";
import Button from "@material-ui/core/Button";
import Box from "@material-ui/core/Box";
import SaveAltIcon from "@material-ui/icons/SaveAlt";

function FileDownloadButton(props) {
	function handleClick(e) {
		if (props.onSave) props.onSave();
	}

	return (
		<Box component="div" display="inline" mr={2}>
			<Button
				variant="contained"
				component="label"
				onClick={handleClick}
				startIcon={<SaveAltIcon />}
			>
				{props.label}
			</Button>
		</Box>
	);
}

export default FileDownloadButton;
