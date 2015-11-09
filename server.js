var sys = require ('sys');
var exec = require ('child_process').exec;
var gcm = require ('node-gcm');
var time = require ('time');
require('date-utils');

var child;
var temhum;

var message = new gcm.Message ();
var regIds = [];

var port = 8082;
var ip = "192.168.0.54";

child = exec ('mkdir /tmp/stream', function (error, stdout, stderr) { // For video streaming
});
child = exec ('raspistill --nopreview -w 640 -h 480 -q 5 -o /tmp/stream/pic3.jpg -tl 100 -t 55555 -th 0:0:0 &', function (error, stdout, stderr) {
}); // For video streaming
child = exec ('python ./detecting.py 22 4', function (error, stdout, stderr) { // For detecting temp-hum
});
child = exec ('LD_LIBRARY_PATH=/usr/local/lib mjpg_streamer -i "input_file.so -f /tmp/stream -n pic.jpg" -o "output_http.so -w /usr/local/www"', function (error, stdout, stderr) {
}); // For video streaming
child = exec ('python saveDB.py', function (error, stdout, stderr) {
}); // For save sleeping's data to DB
child = exec ('python sendLog.py', function (error, stdout, stderr) {
}); // For send sleeping's data to Android

console.log ('Server is waiting for connection');

// For imforming baby's sleeping informations.
var startTime = 0;
var wakeUp = 0;
var sleeping = 0;

// For GCM alarm control
var tempHumGcmOff = 0;
var babyGcmOff = 0;

var server = require('net').createServer(function(socket) {
	console.log ('server has a new connection');

	socket.on ('data', function(data) {
		var signal = data.toString();

		if (signal == 1)
		{
			console.log ('Temp-Hum signal is detected');

			child = exec ('sudo ./AdafruitDHT.py 22 4', function (error, stdout, stderr) {
				temhum = stdout;		
				socket.write (temhum); // Send temp-hum and in-appropriate information to android
				socket.end ();
			});
		}
		else if (signal == 2)
		{
			console.log ('Voice signal is detected');

			child = exec ('omxplayer /home/pi/voice.mp4', function (error, stdout, stderr) {
			}); // Play parents voice
		}
		else if (signal == 3)
		{
			console.log ('Streaming signal is detected');

			child = exec ('LD_LIBRARY_PATH=/usr/local/lib mjpg_streamer -i "input_file.so -f /tmp/stream -n pic.jpg" -o "output_http.so -w /usr/local/www"', function (error, stdout, stderr) {
			}); // For if streaming is broken, reconnect
		}
		else if (signal == 4 && tempHumGcmOff == 0)
		{
			// Send GCM messages to all connected user's android
			var i;
			console.log ('Temperature inappropriate signal is detected');
		
			var message = new gcm.Message ({
				collapseKey: 'demo',
				delayWhileIdle: true,
				timeToLive: 3,
				data : {
					key1: '방 안의 온도를 확인해 주세요!!'
				}
			});

			var server_access_key = 'AIzaSyCAkwJgDPnLbwZwKz7grVxhs7iXtkx6wmo';
			var sender = new gcm.Sender (server_access_key);

			for (i=0; i<regIds.length; i++)
			{
				sender.send (message, regIds[i], 4, function (err, result) {
					console.log (result);
				});
			}
		}
		else if (signal == 5 && tempHumGcmOff == 0)
		{
			// Send GCM messages to all connected user's android
			var i;
			console.log ('Humidity inappropriate signal is detected');

			var message = new gcm.Message ({
				collapseKey: 'demo',
				delayWhileIdle: true,
				timeToLive: 3,
				data : {
					key1: '방 안의 습도를 확인해 주세요!!'
				}
			});

			var server_access_key = 'AIzaSyCAkwJgDPnLbwZwKz7grVxhs7iXtkx6wmo';
			var sender = new gcm.Sender (server_access_key);

			for (i=0; i<regIds.length; i++)
			{
				sender.send (message, regIds[i], 4, function (err, result) {
					console.log (result);
				});
			}
		}
		else if (signal == 6 && tempHumGcmOff == 0)
		{
			// Send GCM messages to all connected user's android
			var i;
			console.log ('Temp-Hum inappropriate signal is detected');

			var message = new gcm.Message ({
				collapseKey: 'demo',
				delayWhileIdle: true,
				timeToLive: 3,
				data : {
					key1: '방 안의 온/습도를 확인해 주세요!!'
				}
			});

			var server_access_key = 'AIzaSyCAkwJgDPnLbwZwKz7grVxhs7iXtkx6wmo';
			var sender = new gcm.Sender (server_access_key);
				
			for (i=0; i<regIds.length; i++)
			{
				sender.send (message, regIds[i], 4, function (err, result) {
					console.log (result);
				});
			}
		}
		else if (signal == 7)
		{	
			// Send GCM messages to all connected user's android
			console.log ('Baby crying signal is detected');
			wakeUp+=1;
			if (sleeping == 1 && babyGcmOff == 0)
			{
				var i;		

				var message = new gcm.Message ({
					collapseKey: 'demo',
					delayWhileIdle: true,
					timeToLive: 3,
					data : {
						key1: '아기가 깬 것 같습니다 !!'
					}
				});
			
				var server_access_key = 'AIzaSyCAkwJgDPnLbwZwKz7grVxhs7iXtkx6wmo';
				var sender = new gcm.Sender (server_access_key);

				for (i=0; i<regIds.length; i++)
				{
					sender.send (message, regIds[i], 4, function (err, result) {
						console.log (result);
					});
				}
		
				child = exec ('omxplayer /home/pi/voice.mp4', function(err, stdout, stderr) {
				}); // Play parents voice
			}
		}
		else if (signal == 8)
		{ // Start baby monitoring
			console.log ('Baby is now sleeping');
			startTime = time.time(); // For show baby's total sleeping time to parents	
			sleeping = 1;
			wakeUp = 0;
			child = exec ('python babyCrying.py', function (error, stdout, stderr) {
			}); // For detecting baby crying
		}
		else if (signal == 9)
		{ // End baby monitoring
			console.log ('Baby is now wake up')
			
			var endTime = time.time();
			var totalTime = endTime - startTime;
			console.log ('Time : ', totalTime);
			startTime = 0;
			sleeping = 0;
			wakeUp-=1;
			// Extract now date
			var date = new Date();
			var year = date.getFullYear(); 
			var month = (date.getMonth() + 1);
			var day = date.getDate();
			var date1;
			if ( day < 10)
			{
				date1 = year.toString() + month.toString() + "0" + day.toString();
			}
			else
			{
				date1 = year.toString() + month.toString() + day.toString();
			}
			// Send baby's sleeping informations.
			if (totalTime >= 60)
			{
				var minutesTmp = Math.floor(totalTime/60);
				var seconds = totalTime%60;
	
				if (minutesTmp >= 60)
				{
					var hours = floor(minutesTmp/60);
					var minutes = minutesTmp%60;

					console.log ('%d 시간 %d 분 %d 초', hours, minutes, seconds);
					
					// Send data to Android				
					socket.write (1 + "." + hours + "." + minutes + "." + seconds + "." + wakeUp);
					socket.end();
				
					// Record data to DB using python
					var net = require ('net');
					var client = new net.Socket();
					client.connect (5001, '192.168.0.54', function () {
						console.log ('Save sleeping data to DB');
						client.write (date1 + "." + hours + "." + minutes + "." + seconds + "." + wakeUp)
					});
				}
				else
				{
					console.log ('%d 분 %d 초', minutesTmp, seconds);
					
					// Send data to Android
					socket.write (1 + "." + 0 + "." + minutesTmp + "." + seconds + "." + wakeUp);
					socket.end();

					// Record data to DB using python
					var net = require ('net');
					var client = new net.Socket();
					client.connect (5001, '192.168.0.54', function () {
						console.log ('Save sleeping data to DB');
						client.write (date1 + "." + 0 + "." + minutesTmp + "." + seconds + "." + wakeUp);
					});
				}
			}
		}
		// Below is controlling GCM alarm
		else if (signal == 10)
		{
			console.log ("Temp-Hum GCM off signal is detected");
			tempHumGcmOff = 1;
		}
		else if (signal == 11)
		{
			console.log ("Temp-Hum GCM on signal is detected");
			tempHumGcmOff = 0;
		}
		else if (signal == 12)
		{
			console.log ("Baby wake up GCM off signal is detected");
			babyGcmOff = 1;
		}
		else if (signal == 13)
		{
			console.log ("Baby wake up GCM on signal is detected");
			babyGcmOff = 0;
		}
		else // Enroll parents GCM registration id
		{
			console.log (signal);
			var i;
			var registered = 0;

			for (i=0; i<regIds.length; i++)
			{
				if (regIds[i] == signal)
				{
					registered = 1;
					break;
				}
			}

			if (!registered)
			{
				regIds.push (signal);
				console.log (regIds.length);
			}
		}
	});
});
server.listen (port, ip);
