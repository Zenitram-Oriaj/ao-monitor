/**
 * Created by Jairo Martinez on 11/24/14.
 */

/**
 * -- /etc/network/interfaces --
 auto eth0
 iface eth0 inet static
 address 192.168.0.101
 gateway 192.168.0.1
 netmask 255.255.255.0
 dns-nameservers 8.8.8.8 8.8.4.4

 sudo service network-manager restart
 sudo service networking restart
 sudo service resolvconf restart

 -------------------------------------------

 -- /etc/environment --
 http_proxy="http://autoproxy.pg.com:8080/"
 https_proxy="http://autoproxy.pg.com:8080/"
 ftp_proxy="http://autoproxy.pg.com:8080/"
 no_proxy="localhost,127.0.0.1,.pg.com,localaddress,137.*,143.*"
 HTTP_PROXY="http://autoproxy.pg.com:8080/"
 HTTPS_PROXY="http://autoproxy.pg.com:8080/"
 FTP_PROXY="http://autoproxy.pg.com:8080/"
 NO_PROXY="localhost,127.0.0.1,.pg.com,localaddress,137.*,143.*"

 */

var os = require('os');
var fs = require('fs');

function readDnsConfig(cb) {
	var ps = require('child_process');
	ps.exec('cat /etc/resolv.conf', function (error, stdout, stderr) {
		if (error) {
			cb(error, '');
		} else {
			var lines = stdout.split("\n");
			var b = [];
			var ip = '';
			for (var i in lines) {
				var a = lines[i].indexOf('nameserver', 0);
				if (a > -1) {
					b = lines[i].split(' ');
					if (b[1].indexOf('.') > -1) {
						ip = b[1];
					}
				}
				if (ip.length > 4) break;
			}
			cb(null, ip);
		}
	});
}

function writeToFile(params, cb) {
	var data =
		'# This file describes the network interfaces available on your system\r' +
		'# and how to activate them. For more information, see interfaces(5).\r' +
		'\r\n' +
		'# The loopback network interface\r' +
		'auto lo\r' +
		'iface lo inet loopback\r' +
		'\r\n' +
		'# The primary network interface\r' +
		'auto ' + params.network.name + '\r';

	switch (params.network.mode) {
		case 'M':
		{
			data += 'iface ' + params.network.name + ' inet static\r' +
				'address ' + params.network.ip + '\r' +
				'gateway ' + params.network.gw + '\r' +
				'netmask ' + params.network.sub + '\r' +
				'dns-nameservers ' + params.network.dns + '\r';
			break;
		}
		case 'A':
		default:
		{
			data += 'iface ' + params.network.name + ' inet dhcp\r';
			break;
		}
	}

	var result = fs.writeFileSync('netInfo.txt', data);
	cb(result);
}

function setNetConfig(serverCfg, cb) {
	if (os.type() == 'Linux') {
		writeToFile(serverCfg, function (rslt) {
			var ps = require('child_process');
			ps.exec('sudo sh /home/roomfinder/ao/shell/netconfig.sh', function (error, stdout, stderr) {
				if (error) {
					console.log('exec error: ' + error);
					cb(error,serverCfg);
				} else {
					console.log('stdout: ' + stdout);
					console.log('stderr: ' + stderr);
					cb(null,serverCfg);
				}
			});
		});
	} else {
		cb(null, serverCfg);
	}
}

module.exports.setNetConfig = setNetConfig;

module.exports.updateConfig = function (serverCfg, cb) {
	var ifcfg = require('netroute').getInfo();
	var netif = os.networkInterfaces();

	if (netif.eth0) {
		netif.eth0.forEach(function (i) {
			if (i.family == 'IPv4') {
				serverCfg.network.name = 'eth0';
				serverCfg.network.ip = i.address;
				serverCfg.network.sub = i.netmask || '0.0.0.0';
			}
		});
	}

	else if (netif.en0) {
		netif.en0.forEach(function (i) {
			if (i.family == 'IPv4') {
				serverCfg.network.name = 'en0';
				serverCfg.network.ip = i.address;
				serverCfg.network.sub = i.netmask || '0.0.0.0';
			}
		});
	}

	else if (netif.em0) {
		netif.em0.forEach(function (i) {
			if (i.family == 'IPv4') {
				serverCfg.network.name = 'em0';
				serverCfg.network.ip = i.address;
				serverCfg.network.sub = i.netmask || '0.0.0.0';
			}
		});
	}

	else if (netif.em1) {
		netif.em1.forEach(function (i) {
			if (i.family == 'IPv4') {
				serverCfg.network.name = 'em1';
				serverCfg.network.ip = i.address;
				serverCfg.network.sub = i.netmask || '0.0.0.0';
			}
		});
	}

	var ip = serverCfg.network.ip.split('.');

	//
	/////////////////////////////////////////////////

	ifcfg.IPv4.forEach(function (s) {
		var idx = s.interface.indexOf('ut');

		if (idx < 0) {
			if (s.gateway.indexOf(ip[0]) > -1) {
				serverCfg.network.gw = s.gateway;
			}
		}
	});

	var a = os.type();
	var b = os.arch();
	var c = os.release();

	serverCfg.server.type = a + ' ' + b + ' (' + c + ')';

	if (os.type() == 'Linux' || os.type() == 'Darwin') {
		readDnsConfig(function (err, res) {
			if (err) {
				cb(serverCfg);
			} else {
				serverCfg.network.dns = res;
				cb(serverCfg);
			}
		});
	} else {
		cb(serverCfg);
	}
};