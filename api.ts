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
const KickEventSubscription = "https://api.kick.com/public/v1/events/subscriptions";


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

app.post('/get_subscribes', async (req, res) => {
	const { accessToken } = req.body;
	if (!accessToken) {
		return res.status(400).json({ error: 'Access token is missing' });
	}
	
	try {
		const response = await fetch(KickEventSubscription, {
			method: 'GET',
			headers: {
				"Authorization": `Bearer ${accessToken}`,
				"Accept": "*/*"
			},
		});

		if (!response.ok) {
			throw new Error();
		}

		const data = await response.json();
		return res.json(data);
	} catch (err: any) {
		console.log(err);
		res.status(500).json({ error: err.stderr || err.message });
	}
});

app.post('/subscribe_chat', async (req, res) => {
	const { userId, accessToken } = req.body;
	if (!userId || !accessToken) {
		return res.status(400).json({ error: 'User id or access token is missing' });
	}
	
	const data = {
		broadcaster_user_id: userId,
		events: [
			{
				name: "chat.message.sent",
				version: 1
			}
		],
		method: "webhook"
	};

	try {
		const response = await fetch(KickEventSubscription, {
			method: 'POST',
			headers: {
				"Authorization": `Bearer ${accessToken}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error();
		}

		const responseJson = await response.json();
		return res.json(responseJson);
	} catch (err: any) {
		res.status(500).json({ error: err.stderr || err.message });
	}
});

app.post('/delete_subscribe', async (req, res) => {
	const { id, accessToken } = req.body;
	if (!id || !accessToken) {
		return res.status(400).json({ error: 'Id or access token is missing' });
	}

	const params = new URLSearchParams();
	params.append("id", id);

	try {
		const response = await fetch(`${KickEventSubscription}?${params.toString()}`, {
			method: 'DELETE',
			headers: {
				"Authorization": `Bearer ${accessToken}`,
				"Accept": "*/*"
			},
		});

		if (!response.ok) {
			throw new Error();
		}

		const data = await response.json();
		return res.json(data);
	} catch (err: any) {
		console.log(err)
		console.log(err.message);
		res.status(500).json({ error: err.stderr || err.message });
	}
});


app.post('/kick_webhook', async (req, res) => {
	
	console.log(req.body);
	

	res.status(200).send();
});



const PORT = 5000;
app.listen(PORT, HOST, () => {
	console.log(`Server running on port ${PORT}`);
});
