/*
 * fis
 * http://web.baidu.com/
 */

'use strict';

var util = module.exports = {};

util.detContext = function(content){
    var reg = /(\bF\.context)(?:\([^)]*\))/g;
    if(reg.test(content)){
       return true;
    }
    return false;
}

util.detMarco = function(content){
	var reg = /\{[^}]+{/;
    if(reg.test(content)){
        return true;
    }
    if(/@mixin/.test(content)){
        return true;
    }
    if(/@var/.test(content)){
        return true;
    }
    if(/@fis/.test(content)){
        return true;
    }
    return false;
}

util.detWidgetExtends = function(content, ld, rd){
    var reg = new RegExp(ld + 'widget(?:\\s+|' + rd + ')(?:[\\s\\S]*?)' + ld + '\/widget\\s*' + rd);
    if(reg.test(content)){
        reg = /\bextends\s*=\s*("(?:[^\\"]|\\[\s\S])+"|'(?:[^\\']|\\[\s\S])+')\s*/;
        if(reg.test(content)){
            return true;
        }
    }
    reg = new RegExp(ld + 'widget_block');
    if(reg.test(content)){
        return true;
    }
    return false;
}

util.trim = function(str, charlist) {
    var whitespace, l = 0,
        i = 0;
    str += '';

    if (!charlist) {
        // default list
        whitespace = " \n\r\t\f\x0b\xa0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000";
    } else {
        // preg_quote custom list
        charlist += '';
        whitespace = charlist.replace(/([\[\]\(\)\.\?\/\*\{\}\+\$\^\:])/g, '$1');
    }

    l = str.length;
    for (i = 0; i < l; i++) {
        if (whitespace.indexOf(str.charAt(i)) === -1) {
            str = str.substring(i);
            break;
        }
    }

    l = str.length;
    for (i = l - 1; i >= 0; i--) {
        if (whitespace.indexOf(str.charAt(i)) === -1) {
            str = str.substring(0, i + 1);
            break;
        }
    }

    return whitespace.indexOf(str.charAt(0)) === -1 ? str : '';
}