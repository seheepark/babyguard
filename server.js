var sys = require ('sys');
var exec = require ('child_process').exec;
var gcm = require ('node-gcm');
var time = require ('time');

var child;
var temhum;

var message = new gcm.Message ();
//var server_access_key = 'AIzaSyCAkwJgDPnLbwZwKz7grVxhs7iXtkx6wmo';
//var sender = new gcm.Sender(server_access_key);
var regIds = [];

var port = 8082;
var ip = "192.168.0.54";

child = exec ('mkdir /tmp/stream', function (error, stdout, stderr) {
});
child = exec ('raspistill --nopreview -w 640 -h 480 -q 5 -o /tmp/stream/pic3.jpg -tl 100 -t 55555 -th 0:0:0 &', function (error, stdout, stderr) {
});
child = exec ('sudo ./detecting.py 22 4', function (error, stdout, stderr) {
});
child = exec ('sudo ./babyCrying.py', function (error, stdout, stderr) {
});
child = exec ('LD_LIBRARY_PATH=/usr/local/lib mjpg_streamer -i "input_file.so -f /tmp/stream -n pic.jpg" -o "output_http.so -w /usr/local/www"', function (error, stdout, stderr) {
});

console.log ('Server is waiting for connection');

// For imforming baby's sleeping informations.
var startTime = 0;
var wakeUp = 0;
var sleeping = 0;

var server = require('net').createServer(function(socket) {
	console.log ('server has a new connection');

	socket.on ('data', function(data) {
		var signal = data.toString();

		if (signal == 1)
		{
			console.log ('Temp-Hum signal is detected');

			child = exec ('sudo ./AdafruitDHT.py 22 4', function (error, stdout, stderr) {
				temhum = stdout;		
				socket.write (temhum);
				socket.end ();
			});
		}
		else if (signal == 2)
		{
			console.log ('Voice signal is detected');

			child = exec ('omxplayer /home/pi/voice.mp4', function (error, stdout, stderr) {
			});
		}
		else if (signal == 3)
		{
			console.log ('Streaming signal is detected');

			child = exec ('LD_LIBRARY_PATH=/usr/local/lib mjpg_streamer -i "input_file.so -f /tmp/stream -n pic.jpg" -o "output_http.so -w /usr/local/www"', function (error, stdout, stderr) {
			});
		}
		else if (signal == 4)
		{
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
		else if (signal == 5)
		{
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
		else if (signal == 6)
		{
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
			if (sleeping == 1)
			{
				var i;
				console.log ('Baby crying signal is detected');
				wakeUp+=1;			

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
				});
			}
		}
		else if (signal == 8)
		{
			console.log ('Baby is now sleeping');
			startTime = time.time();	
			sleeping = 1;
		}
		else if (signal == 9)
		{
			console.log ('Baby is now wake up')
			var endTime = time.time();
			var totalTime = endTime - startTime;
			console.log ('Time : ', totalTime);
			startTime = 0;
			sleeping = 0;
			wakeUp-=1;

			// Send baby's sleeping informations.
			if (totalTime >= 60)
			{
				var minutesTmp = Math.floor(totalTime/60);
				var seconds = totalTime%60;

				if (minutesTmp >= 60)
				{
					var hours = floor(minutesTmp/60);
					var minutes = minutesTmp%60;
					//var i;
					console.log ('%d 시간 %d 분 %d 초', hours, minutes, seconds);
					/*var message = new gcm.Message ({
						collapseKey: 'demo',
						delayWhileIdle: true,
						timeToLive: 3,
						data : {
							key1: '아기 취침 정보 -  아기의 총 수면 시간 : %d 시간 %d 분 %d 초, 중간에 깬 횟수 : %d 번' % (hours, minutes, seconds, wakeUp)
						}
					});
					
					var server_access_key = 'AIzaSyCAkwJgDPnLbwZwKz7grVxhs7iXtkx6wmo';
					var sender = new gcm.Sender (server_access_key);
					
					for (i=0; i<regIds.length; i++)
					{
						sender.send (message, regIds[i], 4, function (err, result) {
							console.log (result);
						});
					}*/
					socket.write (hours)
					socket.end(hours + "." + minutes + "." + seconds + "." + wakeUp);
					wakeUp = 0;
				}
				else
				{
					//var i;
					console.log ('%d 분 %d 초', minutesTmp, seconds);
					/*
					var message = new gcm.Message ({
						collapseKey: 'demo',
						delayWhileIdle: true,
						timeToLive: 3,
						data : {
							key1: '아기 취침 정보 - 아기의 총 수면 시간 : %d 분 %d 초, 중간에 깬 횟수 : %d 번' % (minutesTmp, seconds, wakeUp)
						}
					});
					
					var server_access_key = 'AIzaSyCAkwJgDPnLbwZwKz7grVxhs7iXtkx6wmo';
					var sender = new gcm.Sender (server_access_key);
				
					for (i=0; i<regIds.length; i++)
					{
						sender.send (message, regIds[i], 4, function (err, result) {
							console.log (result);
						});
					}*/
					socket.write (1 + "." + 0 + "." + minutesTmp + "." + seconds + "." + wakeUp);
					socket.end();
					wakeUp = 0;
				}
			}
		}
		else 
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
