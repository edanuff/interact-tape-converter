import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import MoreIcon from "@material-ui/icons/MoreVert";
import HelpIcon from "@material-ui/icons/Help";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import OpenInBrowserIcon from "@material-ui/icons/OpenInBrowser";
import SaveAltIcon from "@material-ui/icons/SaveAlt";
import Divider from "@material-ui/core/Divider";
import Grid from "@material-ui/core/Grid";

import {
	resetTape,
	loadTape,
	loadArchive
} from "./components/TapeFile.js";

import FileUploadButton from "./components/FileUploadButton";
import FileDownloadButton from "./components/FileDownloadButton";
import HelpCard from "./components/HelpCard";
import FileUploadMenuItem from "./components/FileUploadMenuItem";
import { showSnackbar } from "./components/AppSnackbar";

const useStyles = makeStyles((theme) => ({
	root: {
		flexGrow: 1,
	},
	menuButton: {
		marginRight: theme.spacing(2),
	},
	title: {
		flexGrow: 1,
	},
	file_info_box: {
		border: 'black 2px solid',
		borderRadius: '3px',
		textAlign: 'left',
		paddingTop: '10px',
		paddingLeft: '10px',
		minHeight: 200
	},
}));

export default function App() {
	const classes = useStyles();
	const [anchorEl, setAnchorEl] = React.useState(null);

	const handleActionMenuClick = (event) => {
		setAnchorEl(event.currentTarget);
	};

	const handleActionMenuClose = () => {
		setAnchorEl(null);
		console.log("App.handleActionMenuClose");
	};

	const handleUploadTapeAsWav = (arrayBuffer) => {
		loadTape(arrayBuffer);
	};

	const handleUploadTapeAsK7 = (arrayBuffer) => {
		loadArchive(arrayBuffer);
	};

	const handleDownloadTapeAsWav = () => {
		console.log("App.handleDownloadTapeAsWav");
	};

	const handleDownloadTapeAsK7 = () => {
		console.log("App.handleDownloadTapeAsK7");
	};

	return (
		<div className={classes.root}>
			<AppBar position="static">
				<Toolbar>
					<Typography variant="h6" className={classes.title}>
						Interact Tape Converter
					</Typography>
					<IconButton
						aria-label="display more actions"
						edge="end"
						color="inherit"
						aria-controls="action-menu"
						aria-haspopup="true"
						onClick={handleActionMenuClick}
					>
						<MoreIcon />
					</IconButton>
					<Menu
						id="action-menu"
						anchorEl={anchorEl}
						keepMounted
						open={Boolean(anchorEl)}
						onClose={handleActionMenuClose}
					>
						<FileUploadMenuItem
							onClick={handleActionMenuClose}
							accept="audio/*"
							onBuffer={handleUploadTapeAsWav}
						>
							<ListItemIcon>
								<OpenInBrowserIcon fontSize="small" />
							</ListItemIcon>
							Open Tape From Audio File…
						</FileUploadMenuItem>
						<FileUploadMenuItem
							onClick={handleActionMenuClose}
							accept=".k7,.cin"
							onBuffer={handleUploadTapeAsK7}
						>
							<ListItemIcon>
								<OpenInBrowserIcon fontSize="small" />
							</ListItemIcon>
							Open Tape From .K7 or .CIN File…
						</FileUploadMenuItem>
						<MenuItem
							onClick={() => {
								handleActionMenuClose();
								handleDownloadTapeAsWav();
							}}
						>
							<ListItemIcon>
								<SaveAltIcon fontSize="small" />
							</ListItemIcon>
							Save Tape As .WAV File…
						</MenuItem>
						<MenuItem
							onClick={() => {
								handleActionMenuClose();
								handleDownloadTapeAsK7();
							}}
						>
							<ListItemIcon>
								<SaveAltIcon fontSize="small" />
							</ListItemIcon>
							Save Tape As .K7 File…
						</MenuItem>
						<Divider />
						<MenuItem
							onClick={(e) => {
								e.preventDefault();
								window.location.href = "about/";
							}}
						>
							<ListItemIcon>
								<HelpIcon fontSize="small" />
							</ListItemIcon>
							About…
						</MenuItem>
					</Menu>
				</Toolbar>
			</AppBar>
			<Container maxWidth="lg">
				<Grid container spacing={3}>
					<Grid item>
						<Box my={4}>
							<FileUploadButton
								label="Open Tape Audio"
								accept="audio/*"
								onBuffer={handleUploadTapeAsWav}
							/>
							<FileUploadButton
								label="Open Tape .K7 or .CIN"
								accept="*.cin,*.k7"
								onBuffer={handleUploadTapeAsK7}
							/>
							<FileDownloadButton
								label="Save As .K7"
								onSave={handleDownloadTapeAsK7}
							/>
							<FileDownloadButton
								label="Save As .WAV"
								onSave={handleDownloadTapeAsWav}
							/>
						</Box>
						<Box my={4}>
							<div className={classes.file_info_box}>
								No tape file loaded...
							</div>
						</Box>
					</Grid>
					<Grid item xs={1}>
						<Box my={4}>
							<HelpCard />
						</Box>
					</Grid>
				</Grid>
			</Container>
		</div>
	);
}
