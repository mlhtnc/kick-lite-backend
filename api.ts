import express from 'express';
import bodyParser from 'body-parser';
import { exec } from 'child_process';
import util from 'util';
import dotenv from 'dotenv';

dotenv.config();

const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

const execPromise = util.promisify(exec);

const app = express();
app.use(bodyParser.json());

const KickBaseURL = "https://kick.com";


app.post('/get_stream_url', async (req, res) => {
	const { channel } = req.body;
	if (!channel) {
		return res.status(400).json({ error: 'Channel is required' });
	}
	
	try {
		const { stdout } = await execPromise(`yt-dlp -j "${KickBaseURL}/${channel}"`);
		const info = JSON.parse(stdout);

		const formats = info.formats.map(((f: any) => ({url: f.url, height: f.height})));

		res.json({ formats });
	} catch (err: any) {
		res.status(500).json({ error: err.stderr || err.message });
	}
});

const PORT = 5000;
app.listen(PORT, HOST, () => {
	console.log(`Server running on port ${PORT}`);
});
