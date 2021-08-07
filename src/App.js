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
import Divider from "@material-ui/core/Divider";
import Grid from "@material-ui/core/Grid";

import {
	resetTape,
	loadTape,
	loadArchive
} from "./components/TapeFile.js";

import FileUploadButton from "./components/FileUploadButton";
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
		overflowY: "scroll",
		height: 300,
		minHeight: 300
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
							Convert Tape From Audio File To .K7 File…
						</FileUploadMenuItem>
						<FileUploadMenuItem
							onClick={handleActionMenuClose}
							accept=".k7,.cin"
							onBuffer={handleUploadTapeAsK7}
						>
							<ListItemIcon>
								<OpenInBrowserIcon fontSize="small" />
							</ListItemIcon>
							Convert Tape From .K7 or .CIN to .WAV File…
						</FileUploadMenuItem>
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
								label="Convert Tape Audio File To .K7 Tape Archive"
								accept="audio/*"
								onBuffer={handleUploadTapeAsWav}
							/>
							<FileUploadButton
								label="Convert .K7 or .CIN Tape Archive To .WAV File"
								accept="*.cin,*.k7"
								onBuffer={handleUploadTapeAsK7}
							/>
						</Box>
						<Box my={4}>
							<div id="file_info_box" className={classes.file_info_box}>
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
