const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const routes = require("./routes");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use("/api", routes);

const frontendDir = path.resolve(__dirname, "../../frontend");
const frontendIndexPath = path.join(frontendDir, "index.html");

if (fs.existsSync(frontendIndexPath)) {
	app.use(express.static(frontendDir));

	// Serve SPA/static frontend for all non-API paths.
	app.get(/^\/(?!api).*/, (req, res) => {
		res.sendFile(frontendIndexPath);
	});
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
