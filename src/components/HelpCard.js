import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";

const useStyles = makeStyles({
	root: {
		minWidth: 325,
	},
	helpCard: {
		paddingBottom: "0px",
	},
	helpText: {
		fontSize: 12,
		"& ul": {
			paddingLeft: "18px",
			"& li": {
				marginBottom: "8px",
			},
		},
	},
});

export default function HelpCard() {
	const classes = useStyles();

	return (
		<Card className={classes.root}>
			<CardContent className={classes.helpCard}>
				<Typography variant="h5" component="h2">
					How To use
				</Typography>
				<Typography
					variant="body2"
					component="div"
					className={classes.helpText}
				>
					<ul>
						<li>
							This tool is designed for reading and writing <a href="https://en.wikipedia.org/wiki/Interact_Home_Computer">Interact</a> or
							&nbsp;<a href="https://www.old-computers.com/MUSEUM/computer.asp?c=151&st=1">Victor</a>/<a href="https://www.old-computers.com/museum/computer.asp?c=427">Hector</a> cassettes
							in digitized audio files or archived tape
							formats so that you can either use these tapes with emulators
							or with real Interact or Hector machines.
						</li>

						<li>
							Tapes can be loaded from any audio format but 44khz mono is
							recommended when digitizing real tapes.
						</li>

						<li>
							Tape archive files are supported in the .K7 and .CIN formats that 
							are used by many Interact and Hector emulators
							such as MAME/MESS, <a href="http://dchector.free.fr/index.html">DCHector</a>, and 
							&nbsp;<a href="http://www.geocities.ws/emucompboy/">Virtual Interact</a>.
						</li>

					</ul>

				</Typography>
			</CardContent>
			<CardActions>
				<Button
					size="small"
					onClick={(e) => {
						e.preventDefault();
						window.location.href = "about/";
					}}
				>
					Learn More
				</Button>
			</CardActions>
		</Card>
	);
}
