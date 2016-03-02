/*
 * iplib.js v0.1
 * Copyright (c) 2013, Tom Sheldon
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list of conditions
 * and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions
 * and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * Neither the name of the <ORGANIZATION> nor the names of its contributors may be used to endorse
 * or promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
 * FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY
 * WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/*
 *	NetworkAddress
 *	A base class for storing information about generic network addresses.
 *  Nothing is assumed, but it does include a number of functions for ease of use
 *	or to be overidden.
 */
var NetworkAddress = Base.extend({
	constructor:function(address,separator) {
		this._address = address;
		this._separator = separator;

		if(!this.validate()) throw "Invalid Address: "+this.normalize();
	},
	iter:function(callback,radix) {
		/*
		 * Provides a way to iterate over the parts of the IP address.
		 * Passes the each part to the callback, and the index.
		 * Use radix to specify which output format you require (see parts for more info)
		 */
		var p = this.parts(radix);
		for(var i = 0; i < p.length; i++) {
			if(callback(p[i],i) === false) break;
		}
	},
	parts:function(radix) {
		if(!radix) radix = 10;
		var p = this.normalize().split(this._separator);
		for(var i = 0; i < p.length; i++) {
			p[i] = Number(p[i]);
			if(radix!=10) p[i] = p[i].toString(radix);
		}
		return p;

		return this.normalize().split(this._separator);
	},
	raw: function() {
		return this._address;
	},
	normalize:function() {
		return this._address;
	},
	validate:function() {
		return true;
	},
	toString:function() {
		return this.raw();
	}
});

/*
 * An implementation of an IPv4 address
 */
var IPv4 = NetworkAddress.extend({
	constructor:function(address) {
		this.base(address,".");
	},

	validate:function() {
		/*
		 * Returns true if the normalized IP address is a valid IPv4 address
		 */
		var res = true;
		this.iter(function(p) {
			if(p < 0 || p > 255) {
				res = false;
				return false;
			}
		});
		//console.log(res);
		return res;
	},
	iterbits:function(callback) {
		/*
		 * Iterate over each bit of the IP address and runs the callback
		 * Also passes the index to the callback as well
		 */
		var b = this.toBin();
		for(var i = 0; i < b.length; i++) {
			if(callback(parseInt(b[i]),i) === false) break;
		}
	},
	normalize:function() {
		/*
		 * Uses the raw IP address and converts it into a standard IPv4 address
		 */
		var p = this._address.split(this._separator);
		while(p.length < IPv4.PARTS) p.push("0");
		for(var i = 0; i < p.length; i++) {
			while(p[i].length < 3) p[i] = "0"+p[i];
		}
		return p.join(this._separator);
	},
	compliment:function() {
		/*
		 * Returns a new IPv4 object of the inverse address of this IP
		 */
		return IPv4.fromBin(this.toInvBin());
	},
	toBin:function() {
		/*
		 * Returns a binary string representation of the IP address
		 */
		var b = "";
		this.iter(function(p) {
			while(p.length < 8) p = "0"+p;
			b += p;
		},2);
		return b;
	},
	toInvBin:function() {
		/*
		 * Returns the inverse binary representation of the IP address
		 */
		var b = "";
		this.iterbits(function(bit) {
			b += (bit ^ 1);
		});
		return b;
	},
	toInt:function() {
		/*
		 * Returns the integer representation of the IP address
		 */
		return parseInt(this.toBin(),2);
	},
	toHex:function() {
		/*
		 * Returns the hex representation of the IP address
		 */
		var h = "";
		this.iter(function(p) {
			if(p.length < 2) p = "0"+p;
			h += p;
		},16);
		return h;
	},
	add:function(intOrIP) {
		/*
		 * Adds an integer or IP to this IP address and returns a new IPv4 address object
		 * Throws an exception if the resulting IP address is invalid
		 * (i.e. above 255.255.255.255)
		 */
		var num;
		if(typeof intOrIP === "number") {
			num = this.toInt() + intOrIP;
		} else {
			num = this.toInt() + intOrIP.toInt()
		}
		if(num > Math.pow(2,IPv4.BITS)) {
			throw "Error: New IP address out of bounds (too big!)";
		} else {
			return IPv4.fromInt(num);
		}
	},
	minus:function(intOrIP) {
		/*
		 * Subtracts an integer or IP to this IP address and returns a new IPv4 address object
		 * Throws an exception if the resulting IP address is invalid
		 * (i.e. below 0.0.0.0)
		 */
		var num;
		if(typeof intOrIP === "number") {
			num = this.toInt() - intOrIP;
		} else {
			num = this.toInt() - intOrIP.toInt()
		}
		if(num < 0) {
			throw "Error: New IP address out of bounds (too small!)";
		} else {
			return IPv4.fromInt(num);
		}
	},
	gte:function(other) {
		/*
		 * Returns true if this IP address is greater than or equal to "other"
		 */
		return this.toInt() >= other.toInt();
	},
	lte:function(other) {
		/*
		 * Returns true if this IP address is less than or equal to "other"
		 */
		return this.toInt() <= other.toInt();
	},
	gt:function(other) {
		/*
		 * Returns true if this IP address is greater than "other"
		 */
		return this.toInt() > other.toInt();
	},
	lt:function(other) {
		/*
		 * Returns true if this IP address is less than "other"
		 */
		return this.toInt() < other.toInt();
	},
	equals:function(other) {
		/*
		 * Returns true if this IP address is equal to "other"
		 */
		return this.toInt() == other.toInt();
	},
	not:function(other) {
		/*
		 * Returns true if this IP address is not equal to "other"
		 */
		return this.toInt() != other.toInt();
	},
	isMulticast:function() {
		/*
		 * Returns true if this IP address is a multicast address
		 */
		return this.toBin().indexOf("1110") == 0;
	},
	isPrivate:function() {
		/*
		 * Returns true if this IP address is in a private range
		 */
		var private_ranges = IPv4.privateRanges();
		for(var i = 0; i < private_ranges.length; i++) {
			if(private_ranges[i].contains(this)) return true;
		}
		return false;
	},
	isLoopback:function() {
		/*
		 * Returns true if this IP address is in the local range (i.e. 127.0.0.0/8)
		 */
		return (new IPv4Network("127.0.0.0/8")).contains(this);
	}
},{
	/*
	 * Static methods and attributes
	 */
	BITS:32,
	PARTS:4,
	TOTAL:Math.pow(2,32),
	fromBin:function(b) {
		/*
		 * Returns a new IP address object from a binary string
		 */
		while(b.length < IPv4.BITS) b = "0"+b;
		var p = [];
		for(var i = 0; i < IPv4.BITS; i+=8) {
			p.push(parseInt(b.substr(i,8),2));
		}
		return new IPv4(p.join("."));
	},
	fromInt:function(n) {
		/*
		 * Returns a new IP address object from an integer
		 */
		var b = n.toString(2);
		while(b.length < IPv4.BITS) b = "0"+b;
		return IPv4.fromBin(b);
	},
	fromHex:function(h) {
		/*
		 * Returns a new IP address object from a hex string
		 */
		return IPv4.fromInt(parseInt(h,16));
	},
	privateRanges:function() {
		/*
		 * Returns a list of private IPv4 ranges
		 */
		return [new IPv4Network("10.0.0.0/8"),new IPv4Network("172.16.0.0/12"), new IPv4Network("192.168.0.0/16")];
	},
	localhost:function() {
		/*
		 * Returns a localhost IPv4 object  (127.0.0.1)
		 */
		return new IPv4("127.0.0.1");
	},
	zero:function() {
		/*
		 * Returns a zeroed IP address (0.0.0.0)
		 */
		return new IPv4("0.0.0.0");
	}
});

var Subnet = IPv4.extend({
	constructor:function(addressOrSlash) {
		if(addressOrSlash.charAt(0) == "/") {
			addressOrSlash = Subnet.fromSlash(addressOrSlash);
		}
		this.base(addressOrSlash);
	},
	validate:function() {
		if(!this.base()) return false;
		var res = true;
		var b = this.toBin();
		var res = (b.search(/^1*0*$/) == 0)
		return res;
	},
	add:function() {
		return undefined;
	},
	minus:function() {
		return undefined;
	},
	toSlash:function() {
		var b = this.toBin().split("");
		var c = 0;
		for(var i = 0; i < b.length; i++) {
			if(b[i] == "1") c += 1;
			else break;
		}
		return "/"+c;
	},
  toInt:function() {
  	return Number(this.toSlash(this).replace("/",""));
  }
},{
	fromSlash:function(slash) {
		if(slash.charAt(0) != "/") return null;

		var n = Number(slash.replace("/",""));

		if(n < 0 || n > IPv4.BITS) {
			return null;
		}

		var b = "";
		for(var i = 0; i < IPv4.BITS; i++) {
			if(i < n) b+= "1";
			else b+= "0";
		}
		var a = [];
		for(var i = 0; i < IPv4.BITS; i+=8) {
			a.push(parseInt(b.substr(i,8),2));
		}
		return a.join(".");
	},
	validOctets:function() {
		return [0,128,192,224,240,248,252,254,255];
	}
});

/*
 * A class to denote a complete address for IPv4, using an IP address and a Subnet.
 */
var IPv4Interface = Base.extend({
	constructor:function() {
		/*
		 * Takes 1 or 2 arguments. If the first argument is a string, then it will parse
		 * an IP address and subnet from it.
		 * If it is not a string, then the first argument should be an IPv4 object and the second
		 * a Subnet object.
		 */
		if(typeof arguments[0] === "string") {
			var s = arguments[0].split("/");
			this.ip = new IPv4(s[0]);
			if(s.length < 2) s.push("32");
			this.mask = new Subnet("/"+s[1]);
		} else {
			this.ip = arguments[0];
			this.mask = arguments[1];
		}
	},
	network:function() {
		/*
		 * Returns an IPv4 object of the Network address
		 */
		var a = this.ip.toBin();
		var b = this.mask.toBin();
		var c = "";
		for(var i = 0; i < a.length; i++) {
			c += Number(a[i]) & Number(b[i]);
		}
		return new IPv4.fromBin(c);
	},
	first:function() {
		/*
		 * Returns an IPv4 object of the first usable address in the range
		 */
		return this.network()<31 ? this.network().add(1) : this.network();
	},
	last:function() {
		/*
		 * Returns an IPv4 object of the last usable address in the range
		 */
		switch(this.mask.toInt()){
			case 31: return this.broadcast()
			case 32: return this.network()
			default: return this.broadcast().minus(1)
 		}
	},
	range:function() {
		/*
		 * Returns a 2-array of the first and last IP addresses in the network
		 */
		return [this.first(),this.last()];
	},
	broadcast:function() {
		/*
		 * Returns an IPv4 object of the Broadcast address
		 */
		if(this.mask.toInt() == 32) return this.ip;

		var a = this.ip.toBin();
		var b = this.mask.toInvBin();
		var c = "";
		for(var i = 0; i < a.length; i++) {
			c += Number(a[i]) | Number(b[i]);
		}
		return new IPv4.fromBin(c);
	},
	contains:function(ip) {
		/*
		 * Returns true if the given IP is in the range
		 */
		var r = this.range();
		return ip.gte(r[0]) && ip.lte(r[1]);
	},
	cidr:function() {
		return this.ip.normalize()+this.mask.toSlash();
	},
    toString:function() {
        return this.network()+this.mask.toSlash();
    },
	count:function(only_usable) {
		/*
		 * Returns the number of IP addresses in the range
		 * If only_usable is true, then the network and broadcast addresses are ignored
		 */
		if(only_usable==undefined) only_usable=true;
		var c = Math.abs(this.broadcast().toInt() - this.network().toInt() + 1);
		if(only_usable) c-=2;
		return c;
	},
	iter:function(callback,only_usable) {
		/*
			Loops over all IP addresses in the range
			You can stop the iteration if you return false from the callback.
			Anything else will cause the looping to continue;
		*/
		if(only_usable==undefined) only_usable=true;
		var r = [];
		if(only_usable) r = this.range();
		else r = [this.network(),this.broadcast()];

		var i = r[0].toInt();
		var c = 0;
		while(i <= r[1].toInt()) {
			var cur = IPv4.fromInt(i++);
			if(callback(cur,c++) === false) {
				break;
			}
		}
	}
});


var IPv4Network = IPv4Interface.extend({
	constructor:function() {
		this.base.apply(this,arguments);
		if(this.network().not(this.ip)) {
			throw "Invalid IP given for Network: Must be a network address!";
		}
	},
	is_superset:function(othernet) {
		/*
		 * Returns true if this IPv4Network wholely encompasses the other network
		 */
		return (this.network().lte(othernet.network()) && this.broadcast().gte(othernet.broadcast()));
	},
	is_subset:function(othernet) {
		/*
		 * Returns true if this IPv4Network is wholely contained within the other network
		 */
		return (this.network().gte(othernet.network()) && this.broadcast().lte(othernet.broadcast()));
	},
	is_overlapping:function(othernet) {
		/*
		 * Returns true if this IPv4Network overlaps with the other IPv4Network
		 */
         // check if othernet is inside this net and vice versa
         if (this.is_subset(othernet) || othernet.is_subset(this)) return true;
         // check if partial overlapping to the left is true
         if ( this.network().gte(othernet.network()) && this.broadcast().lte(othernet.network()) && this.broadcast().gte(othernet.broadcast()) ) return true;
         // check if partial overlapping to the right is true
         if ( this.network().lte(othernet.network()) && this.network().gte(othernet.broadcast()) && this.broadcast().lte(othernet.broadcast()) ) return true;
		 // if reached this point, no overlap was detected
	     return false;
	},
    any_overlapping_str:function(networkStringArray) {
        /*
         * networkStringArray is an array of strings containing network addresses against which to test overlapping
         * return true on the first overlapping network address found on the list, or false if no overlap found
         */
		//log.info("iplib: testing overlap on "+this.toString());
        for (var i in networkStringArray) {
			//log.info("iplib: testing overlap against "+networkStringArray[i]);
            if ( this.is_overlapping( new IPv4Network(networkStringArray[i]) ) ) return true;
        }
        return false;
    },
    any_overlapping_net:function(networkIPv4NetworkArray) {
        /*
         * networkIPv4NetowrkArray is an array of IPv4Network objects against which to test overlapping
         * return true on the first overlapping network address found on the list, or false if no overlap found
         */
        for (var i in networkIPv4NetworkArray) {
            if ( this.is_overlapping( networkIPv4NetworkArray[i] ) ) return true;
        }
        return false;
    }
});

var IPv6 = NetworkAddress.extend({
	constructor:function(address) {
		this.base(address,":");
	},
	normalize:function() {
		var r = this.raw();
		var dblcol = r.indexOf("::");
		if(dblcol != -1) {
			if(r.charAt(dblcol+2) != ":") {
				num_existing = (r.split(this._separator).length - 1) - 2;
				var c = "";

				for(var i = 0; i < 7-num_existing; i++) c += ":";
				r = r.replace("::",c);
			}
		}

		var p = r.split(this._separator);
		while(p.length < IPv6.PARTS) p.push("0");
		for(var i = 0; i < p.length; i++) {
			while(p[i].length < 4) p[i] = "0"+p[i];
		}
		return p.join(this._separator);
	},
	parts:function(radix) {
		if(!radix) radix = 16;
		return this.base(radix);
	},
	toBin:function() {
		var p = this.parts(10);
		var b = '';
		for(var i = 0; i < p.length; i++) {
			var _b = p[i].toString(2);
			while(_b.length < 16) _b = "0"+_b;
			b += _b;
		}
		return b;
	},
	toInt:function() {
		return parseInt(this.toBin(),2);
	},
	toHex:function() {
		return this.toInt().toString(16);
	},
	compact:function() {
		var p = this.parts();
		for(var i = 0; i < p.length; i++) {
			if(parseInt(p[i],16) == 0) {
				p[i] = "";
			}
		}
		//if(p.join(":").match("(A-F,0-9)*::"))
		var re = new RegExp('(\:{3,})','ig');
		var ex = re.exec(p.join(":"));
		var c = p.join(":");
		var d = c.split("");
		d.splice(ex.index,ex[0].length,"::");
		return d.join("");
	}
},{
	PARTS:8
});
