import React from "react";
import Snackbar from "@material-ui/core/Snackbar";
import MuiAlert from "@material-ui/lab/Alert";

function Alert(props) {
	return <MuiAlert elevation={6} variant="filled" {...props} />;
}

let show_snackbar_func = null;

export function showSnackbar(sev, msg) {
	console.log("showSnackbar: (" + sev + ") " + msg);
	if (show_snackbar_func) show_snackbar_func(sev, msg);
}

export default function AppSnackbar(props) {
	const [open, setOpen] = React.useState(false);
	const [sev, setSev] = React.useState("success");
	const [msg, setMsg] = React.useState("Success!");

	const handleClose = (event, reason) => {
		if (reason === "clickaway") {
			return;
		}

		setOpen(false);
	};

	const doShowSnackbar = (sev, msg) => {
		setSev(sev);
		setMsg(msg);
		setOpen(true);
	};
	show_snackbar_func = doShowSnackbar;

	return (
		<Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
			<Alert onClose={handleClose} severity={sev}>
				{msg}
			</Alert>
		</Snackbar>
	);
}
