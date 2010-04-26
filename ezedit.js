var oldElement = null;
var savedValues = new Object();
var loadedEditor = false;
var curKeyState = 0;
var curEditMode = 0;
var sessionId = false;

/*
 * mode: 'cms' =>
 *     there is a back-end called 'ezedit.php'
 *     
 */

var ezconfig = {
	mode: 'cms', // alt: 'standalone'
	backend: 'ezedit.php', // standalone mode: ignored.
	editor: 'ezedit.php?editor', // js -- standalone mode default: 'nicEdit.js'
	toolbar: 'ezedit.php?toolbar', // sprite -- standalone mode default: 'nicEditorIcons.gif'
	select: 'tagged', // Either 'tagged' or 'all' with default plugin
	//etc.
};

if(_ezbl) {
	// Bookmarklet!
	ezconfig.mode = 'standalone';
	ezconfig.editor = 'http://labs.voilaweb.com/ezedit/bookmarklet/ezedit.php?editor';
	ezconfig.toolbar = 'http://labs.voilaweb.com/ezedit/bookmarklet/ezedit.php?toolbar';
	ezconfig.select = 'all';
}

document.getComputedValue = function(element, style) {
	var computedValue;
	if(typeof element.currentStyle != 'undefined') {
		computedValue = element.currentStyle;
	}
	else {
		computedValue = document.defaultView.getComputedStyle(element, null);
	}
	return computedValue[style];
}

document.getIntegerFromRGB = function(rgb) {
	var sp = rgb.match(/[0-9,\s]+/g)[0].split(", ");
	return parseInt(sp[0]) * 256 * 256 + parseInt(sp[1]) * 256 + parseInt(sp[2]);
}

document.getViewportWidth = function() {
	return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
}

document.getViewportHeight = function() {
	return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
}

document.dontBubble = function(event) {
	if(event.stopPropagation) {
		event.stopPropagation();
	}
	else {
		event.cancelBubble = true;
	}
}

document.isClass = function(element, classname) {
	if(!element.className) {
		return false;
	}
	var classNames = element.className.split(' ');
	var uClassName = classname.toUpperCase();
	for(var i in classNames) {
		if(classNames[i].toUpperCase() == uClassName) {
			return true;
		}
	}
	return false;
}

document.getPageName = function() {
	var qm = document.location.href.indexOf('?');
	var end = (qm == -1) ? document.location.href.length : qm;
	var fn = document.location.href.substring(document.location.href.lastIndexOf('/')+1, end);
	return fn;
}

document.loadScript = function(scriptName, callback) {
	var head = document.getElementsByTagName('head')[0]; // TODO What if no head?
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = scriptName;
	if(callback) {
		script.onload = callback;
	}
	head.appendChild(script);
}

document.onkeypress = function(event) {
	if(!event) {
		event = window.event;
	}
	if(!event.ctrlKey) {
		curKeyState = 0;
		return;
	}
	var c = event.keyCode || event.which;
	if(c == 26) {
		curKeyState++;
		if(curKeyState > 1) {
			curKeyState = 0;
			if(curEditMode) {
				document.setStatus(false);
				curEditMode = 0;
			}
			else {
				if(sessionId) {
					document.setStatus('editing');
					curEditMode = 1;
				}
				else {
					document.displayLogin();
				}
			}
		}
	}
	else {
		curKeyState = 0;
	}
}

document.displayLogin = function() {
	if(ezconfig.mode == 'standalone') {
		sessionId = 1;
		document.setStatus('editing');
		curEditMode = 1;
		return;
	}

	document.xhrSend({'g':'sid'}, function(response) {
		if(response != '*' && parseInt(response) > 0) {
			sessionId = response;
			document.setStatus('editing');
			curEditMode = 1;
			return;
		}

		var loginelement = document.createElement('div');
		loginelement.id = '_ez_login';
		loginelement.style.position = 'absolute';
		loginelement.style.paddingTop = '4px';
		loginelement.style.paddingBottom = '4px';
		loginelement.style.paddingLeft = '4px';
		loginelement.style.paddingRight = '4px';
		loginelement.style.backgroundColor = '#eeeeee';
		loginelement.style.border = '2px solid black';
		document.body.appendChild(loginelement);
		loginelement.innerHTML='Username:<br /><input type="text" id="_ez_username" name="username" /><br />Password:<br /><input type="password" id="_ez_password" name="password" /><br /><input type="button" name="submit" value="login" id="_ez_login_button" /> ';
		loginelement.style.top = '1px';
		loginelement.style.left =  '1px';
		loginelement.style.zIndex = 9999;
		document.getElementById('_ez_login_button').onclick = function(event) {
			var username = document.getElementById('_ez_username').value;
			var password = document.getElementById('_ez_password').value;
			if(username == '' || password == '') {
				alert("You need to enter a username and a password");
				return;
			}
			document.body.removeChild(loginelement);
			document.xhrSend({'u':username, 'p':password}, function(response) {
				if(parseInt(response) > 0) {
					sessionId = response;
					document.setStatus('editing');
					curEditMode = 1;
					return;
				}
				alert(response);
			});
		}
	});
}

document.setStatus = function(txt) {
	if(txt) {
		var statusbar = document.createElement('div');
		statusbar.id = '_ez_statusbar';
		statusbar.style.position = 'absolute';
		statusbar.style.paddingTop = '4px';
		statusbar.style.paddingBottom = '4px';
		statusbar.style.paddingLeft = '4px';
		statusbar.style.paddingRight = '4px';
		statusbar.style.backgroundColor = '#eeeeee';
		statusbar.style.border = '2px solid black';
		document.body.appendChild(statusbar);
		var textElement = document.createTextNode(txt);
		statusbar.appendChild(textElement);
		if(ezconfig.mode != 'standalone') {
			var linkElement = document.createElement('div');
			linkElement.innerHTML = '<a href="#" id="_ez_logout">logout</a>';
			statusbar.appendChild(linkElement);
		}
		statusbar.style.top = '1px';
		statusbar.style.left =  '1px';
		statusbar.style.zIndex = 9999;
		if(ezconfig.mode != 'standalone') {
			document.getElementById('_ez_logout').onclick = function(event) {
				document.xhrSend({'a':'logout'}, function(response) {
					sessionId = false;
					document.setStatus(false);
					curEditMode = 0;
					alert("Logged out");
				});
				return false;
			};
		}
	}
	else {
		var element = document.getElementById('_ez_statusbar');
		if(!element) {
			return;
		}
		document.body.removeChild(element);
	}
}

document.onmousemove = function(event) {
	var self = document.onmousemove;
	document.onmousemove = null;
	if(!event) {
		event = window.event;
	}
	if(!curEditMode || !event.ctrlKey) {
		if(oldElement != null) {
			oldElement.element.onclick = oldElement.onClick;
			oldElement.element.style.border = oldElement.borderStyle;
			oldElement = null;
		}
		document.onmousemove = self;
		return;
	}
	var src = event.srcElement;
	if(!src) {
		document.onmousemove = self;
		return;
	}
	if(ezconfig.select == 'tagged') {
		if(!document.isClass(src, 'ezedit')) {
			document.onmousemove = self;
			return;
		}
	}
	//
	if(oldElement != null) {
		if(oldElement == src) {
			document.onmousemove = self;
			return;
		}
		oldElement.element.onclick = oldElement.onClick;
		oldElement.element.style.border = oldElement.borderStyle;
		oldElement = null;
	}
	var borderStyle = document.getComputedValue(src, 'border');
	var newBorderStyle = '1px dashed red';
	var onClickHandler = src.onclick;
	src.style.border = newBorderStyle;
	src.onclick = function(event) {
		oldElement.element.onclick = oldElement.onClick;
		oldElement.element.style.border = oldElement.borderStyle;
		oldElement = null;
		document.onelementclick(src);
	}
	oldElement = new Object();
	oldElement.element = src;
	oldElement.borderStyle = borderStyle;
	oldElement.onClick = onClickHandler;
	//
	document.onmousemove = self;
}

document.onelementclick = function(src) {
	savedValues.id = src.id;
	savedValues.content = src.innerHTML;
	savedValues.onMouseMove = document.onmousemove;
	src.id = '_ez_editing';
	document.onmousemove = null;
	if(loadedEditor) {
		document.displayEditor(src);
	}
	else {
		document.loadScript(ezconfig.editor, function() {
			document.displayEditor(src);
		});
	}
}

document.displayEditor = function(src) {
	loadedEditor = true;
	var editor = new nicEditor({iconsPath:ezconfig.toolbar, fullPanel:true});
	var toolbar = document.createElement('div');
	toolbar.id = '_ez_toolbar';
	toolbar.style.position = 'absolute';
	toolbar.style.paddingTop = '4px';
	toolbar.style.paddingBottom = '4px';
	toolbar.style.paddingLeft = '4px';
	toolbar.style.paddingRight = '4px';
	toolbar.style.backgroundColor = '#eeeeee';
	toolbar.style.border = '2px solid black';
	document.body.appendChild(toolbar);
	var tbContainer = document.createElement('div');
	tbContainer.id = '_ez_toolbar_container';
	toolbar.appendChild(tbContainer);
	editor.setPanel('_ez_toolbar_container');
	var koButton = document.createElement('button');
	koButton.innerHTML = 'X';
	koButton.style.width = '64px';
	koButton.style.backgroundColor = '#fff5f5';
	koButton.style.borderTop = '1px solid #ddd';
	koButton.style.borderLeft = '1px solid #ddd';
	koButton.style.borderBottom = '1px solid #ddd';
	koButton.style.borderRight = '1px solid #ddd';
	koButton.style.color = '#565656';
	koButton.style.fontFamily = 'Lucida Grande';
	koButton.style.lineHeight = '130%';
	koButton.onmouseover = function(event) {
		koButton.style.backgroundColor = '#ffe5e5';
	}
	koButton.onmouseout = function(event) {
		koButton.style.backgroundColor = '#fff5f5';
	}
	koButton.onclick = function(event) {
		document.body.removeChild(toolbar);
		editor.removeInstance('_ez_editing');
		src.innerHTML = savedValues.content;
		src.id = savedValues.id;
		document.onmousemove = savedValues.onMouseMove;
	}
	toolbar.appendChild(koButton);
	var okButton = document.createElement('button');
	okButton.innerHTML = 'OK';
	okButton.style.width = '64px';
	okButton.style.marginLeft = '8px';
	okButton.style.backgroundColor = '#f5fff5';
	okButton.style.borderTop = '1px solid #ddd';
	okButton.style.borderLeft = '1px solid #ddd';
	okButton.style.borderBottom = '1px solid #ddd';
	okButton.style.borderRight = '1px solid #ddd';
	okButton.style.color = '#565656';
	okButton.style.fontFamily = 'Lucida Grande';
	okButton.style.lineHeight = '130%';
	okButton.onmouseover = function(event) {
		okButton.style.backgroundColor = '#e5ffe5';
	}
	okButton.onmouseout = function(event) {
		okButton.style.backgroundColor = '#f5fff5';
	}
	okButton.onclick = function(event) {
		document.body.removeChild(toolbar);
		editor.removeInstance('_ez_editing');
		src.id = savedValues.id;
		if(ezconfig.mode != 'standalone') {
			if(document.isClass(src, 'ezedit')) {
				document.saveBit(src.id, src.innerHTML);
			}
			else {
				document.savePage();
			}
		}
		document.onmousemove = savedValues.onMouseMove;
	}
	toolbar.appendChild(okButton);
	var noticeTxt = document.createElement('span');
	noticeTxt.innerHTML = '<i>ezeditor</i>';
	noticeTxt.style.marginLeft = '64px';
	toolbar.appendChild(noticeTxt);
	if(!src.offsetParent) {
		alert("Sorry, I do not understand this browser. Sorry. Sorry.");
		return;
	}
	var obj = src;
	var objLeft = 0;
	var objTop = 0;
	do {
		objLeft += obj.offsetLeft;
		objTop += obj.offsetTop;
	} while(obj = obj.offsetParent);
	var tbTop = objTop - toolbar.offsetHeight;
	if(tbTop < 0) {
		tbTop = objTop + src.offsetHeight;
	}
	var tbLeft = objLeft;
	if(tbLeft + toolbar.offsetWidth > document.getViewportWidth()) {
		tbLeft = document.getViewportWidth() - toolbar.offsetWidth;
	}
	toolbar.style.top = tbTop + 'px';
	toolbar.style.left = tbLeft + 'px';
	toolbar.style.zIndex = 9999;
	editor.addInstance('_ez_editing');
}

// Note: the saved page may not look exactly like the original page:
// Some stuff is intepreted by your browser and as such will be somewhat re-arranged
// Also, where your browser is liberal, we may end up enforcing some stricter rules:
// For instamce, ampersand becomes '&amp;'
document.savePage = function() {
//	Would work also: var code = document.getElementsByTagName('html')[0].innerHTML;
	var code = document.documentElement.innerHTML;
	document.xhrSend({'q':code}, function(response) {
		alert(response);
	});
}

document.saveBit = function(id, code) {
	var len = savedValues.content.length;
	document.xhrSend({'q':code, 'b':id, 'l':len}, function(response) {
		alert(response);
	});
}

document.xhrSend = function(args, callback, method) {
	var xmlhttp;
	if(window.XMLHttpRequest) {
		xmlhttp = new XMLHttpRequest();
	}
	else if(window.ActiveXObject) {
		xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
	}
	xmlhttp.onreadystatechange = function() {
		if(xmlhttp.readyState != 4) {
			return;
		}
		if(callback) {
			callback(xmlhttp.responseText);
		}
	}
	var pageName = document.getPageName();
	var url;
	if(method && method == 'GET') {
		url = ezconfig.backend + '?uid=' + Math.random() + '&p=' + encodeURIComponent(pageName);
		for(arg in args) {
			url += '&' + arg + '=' + encodeURIComponent(args[arg]);
		}
		xmlhttp.open("GET", url, true);
		xmlhttp.send(null);
	}
	else {
		url = ezconfig.backend + '?uid=' + Math.random();
		xmlhttp.open("POST", url, true);
		var params = 'p=' + encodeURIComponent(pageName);
		for(arg in args) {
			params += '&' + arg + '=' + encodeURIComponent(args[arg]);
		}
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send(params);
	}
}

/*
document.onmousedown = function(event) {
	var self = document.onmousedown;
	document.onmousedown = null;
	if(!event.altKey) {
		document.onmousedown = self;
		return;
	}
	var src = event.srcElement;
	if(!src) {
		document.onmousedown = self;
		return;
	}
	//
	if(oldElement != null) {
		oldElement.element.style.border = oldElement.borderStyle;
		oldElement = null;
	}
	var bgColor = document.getComputedValue(src, 'backgroundColor');
	var newBgColor = '#' + parseInt(255 * 256 * 256 + 255 * 256 + 255 - document.getIntegerFromRGB(bgColor)).toString(16);
	var borderStyle = document.getComputedValue(src, 'border');
	var newBorderStyle = '3px solid red';
	src.style.border = newBorderStyle;
	src.style.backgroundColor = newBgColor;
	oldElement = new Object();
	oldElement.element = src;
	oldElement.bgColor = bgColor;
	oldElement.borderStyle = borderStyle;
	//
	document.dontBubble(event);
	document.onmousedown = self;
}
*/
