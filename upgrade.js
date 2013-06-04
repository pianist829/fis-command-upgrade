/*
 * fis
 * http://fis.baidu.com/
 */

'use strict';

var fs = require('fs'),
    pth = require('path'),
    xmlreader = require('xmlreader'),
    js = require('./lib/jsUpgrade.js'),
    css = require('./lib/cssUpgrade.js'),
    tpl = require('./lib/tplUpgrade.js'),
    _exists = fs.existsSync || pth.existsSync;

exports.name = 'upgrade';
exports.desc = 'Upgrade 1.0 - 2.0';
exports.register = function(commander) {
    var namespace, ld, rd,
        model = 0,
        widgetInline = false;

    commander
        .option('--namespace <namespace>', 'namespace', String, 'common')
        .option('--ld <smarty left delimiter>', 'smarty left delimiter', String, '{%')
        .option('--rd <smarty right delimiter>', 'smarty right delimiter', String, '%}')
        .option('--model <Upgrade model>', 'Upgrade model', String, '0')
        .action(function(options) {
//            namespace = options.namespace;
            model = options.model;
            ld = options.ld;
            rd = options.rd;
            var root = fis.util.realpath(process.cwd());
            //判断是不是一个正规模块
            var xmlpath = root + '/config/fis-config.xml';
            if(_exists(xmlpath)){
                xmlreader.read(fis.util.read(xmlpath), function(errors, res){
                    if(null !== errors ){
                        console.log(errors)
                        return;
                    }
                    if(res.project.attributes()['modulename']){
                        namespace = res.project.attributes().modulename;
                    }else{
                        console.log('There has no modulename!');
                        return;
                    }
                    if(res.project['smarty']){
                        if(res.project.smarty.attributes()['left_delimiter']){
                            ld = res.project.smarty.attributes().left_delimiter;
                        }
                        if(res.project.smarty.attributes()['right_delimiter']){
                            rd = res.project.smarty.attributes().right_delimiter;
                        }
                    }
                    if(res.project['setting']){
                        if(res.project['setting']['WidgetInlineSyntax']){
                            if(res.project['setting']['WidgetInlineSyntax'].attributes()['enable']){
                                var v = res.project['setting']['WidgetInlineSyntax'].attributes()['enable'];
                                widgetInline = (v == 'true' || v == '1');
                            }
                        }
                    }
                })
            }else{
                console.log('No configuration file, Please check the catalog is correct!');
            }
            fis.util.find(root, /.*\.(tpl|js|html|css)$/).forEach(function(filepath) {
                var content = fis.util.read(filepath);
                content = js.update(content, namespace);
                filepath = filepath.replace(/[\/\\]+/g, '/');
                content = css.update(content, namespace, filepath, root);
                if(/\.tpl$/.test(filepath)){
                    content = tpl.update(content, namespace, ld, rd, filepath, root, widgetInline);
                }
                if(model == 1){
                    filepath = root + '/' + namespace + '_2' +filepath.replace(root, '');
                }
                fis.util.write(filepath, content);
            });
            var config = 'fis.config.require(\'pc\');\n'
                       + 'fis.config.merge({\n'
                       + '      namespace : \'' + namespace +'\',\n'
                       + '});';
            var configPath = root + '/fis-conf.js';
            fis.util.write(configPath, config);
        });
};
