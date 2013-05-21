/*
 * fis
 * http://fis.baidu.com/
 */

'use strict';

exports.name = 'upgrade';
exports.desc = 'Upgrade 1.0 - 2.0';
exports.register = function(commander) {
    var namespace, ld, rd;
    function updateLibPath(content) {
        var libs = [
            'tangram',
            'fis',
            'magic',
            'gmu',
        ];

        function inArray (needle, haystack, argStrict) {
            // http://kevin.vanzonneveld.net
            var key = '',
                strict = !! argStrict;

            if (strict) {
                for (key in haystack) {
                    if (haystack[key] === needle) {
                        return true;
                    }
                }
            } else {
                for (key in haystack) {
                    if (haystack[key] == needle) {
                        return true;
                    }
                }
            }

            return false;
        }

        function getPathId(v) {
            if (!/\.js$/.test(v) && v.indexOf(':') != -1) {
                var p = v.indexOf(':');
                var prefix = v.substr(0, p);
                var subpath = v.substr(p + 1);
                var comp = subpath;
                if (inArray(prefix, libs)) {
                    p = subpath.lastIndexOf('/');
                    if (p !== -1) {
                        comp = subpath.substr(p + 1);
                    }
                    v = 'common:static/common/lib/' + prefix + '/' + subpath + '/' + comp + '.js';
                }
            }
            return v;
        }

        function parseRequire(content) {
            var reg = /\brequire\s*\(\s*("(?:[^\\"]|\\[\s\S])+"|'(?:[^\\']|\\[\s\S])+')\s*\)/g;
            content = content.replace(reg, function(m, value){
                if(value){
                    var info = fis.util.stringQuote(value);
                    value = info.rest.trim();
                    value = getPathId(value);
                    m = 'require(' + info.quote + value + info.quote + ')';
                }
                return m;
            });
            return content;
        }

        function parseUse(content) {
            var reg = /F.use\s*\(\s*("(?:[^\\"]|\\[\s\S])+"|'(?:[^\\']|\\[\s\S])+'|(?:\[[^\[\]]+?\]))\s*/g;
            return content.replace(reg, function (m , value) {
                if (value) {
                    var hasBrackets = false;
                    var values = [];
                    value = value.trim().replace(/(^\[|\]$)/g, function(m, v) {
                        if (v) {
                            hasBrackets = true;
                        }
                        return '';
                    });
                    values = value.split(/\s*,\s*/);
                    values = values.map(function(v) {
                        var info = fis.util.stringQuote(v);
                        v = info.rest.trim();
                        v = getPathId(v);
                        return info.quote + v + info.quote;
                    });
                    if (hasBrackets) {
                        m = 'F.use([' + values.join(', ') + ']';
                    } else {
                        m = 'F.use(' + values.join(', ');
                    }
                }
                return m;
            });
        }
        content = parseRequire(content);
        content = parseUse(content);
        return content;
    }

    function updateWidgetPath(content) {
        function pregQuote (str, delimiter) {
            // http://kevin.vanzonneveld.net
            return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
        }
        var l_ld = pregQuote(ld);
        var l_rd = pregQuote(rd);
        var reg = new RegExp('(?:'+l_ld+'\\s*\\bwidget([\\s\\S]*?)'+l_rd+'|'+l_ld+'\\s*\\/widget\\s*'+l_rd+')', 'g');
        content = content.replace(reg, function(m, value) {
            if (value) {
                var nameReg = /name\s*=\s*("(?:[^\\"]|\\[\s\S])+"|'(?:[^\\']|\\[\s\S])+')\s*/;
                if (!nameReg.test(value)) {
                    m = '';
                } else {
                    value = value.replace(nameReg, function (m1, v) {
                        if (v && v.indexOf(':') === -1) {
                            var info = fis.util.stringQuote(v);
                            v = info.rest.trim();
                            v = namespace+':'+v;
                            m1 = 'name=' + info.quote + v + info.quote + ' ';
                        }
                        return m1;
                    });
                    m = ld + 'widget '  + value + rd;
                }
            } else {
                m = '';
            }
            return m;
        });
        return content;
    }

    commander
        .option('--namespace <namespace>', 'namespace', String, 'common')
        .option('--ld <smarty left delimiter>', 'smarty left delimiter', String, '{%')
        .option('--rd <smarty right delimiter>', 'smarty right delimiter', String, '%}')
        .action(function(options) {
            namesapce = options.namespace;
            ld = options.ld;
            rd = options.rd;
            var root = fis.util.realpath(process.cwd());
            fis.util.find(root, /.*\.(tpl|js|html)/).forEach(function(filepath) {
                var content = fis.util.read(filepath);
                if (/\.js$/.test(filepath)) {
                    content = updateLibPath(content);
                }

                if (/\.(tpl|html)$/.test(filepath)) {
                    content = updateLibPath(content);
                    content = updateWidgetPath(content);
                }
                fis.util.write(filepath, content);
            });
        });
};
