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
    util = require('./lib/util.js'),
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
            namespace = options.namespace;
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
            var macro = new Array();
            var widget = new Array();
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

                if(/\.tpl$/.test(filepath) && util.detWidgetExtends(content, ld, rd)){
                    widget.push(filepath);
                }
                if(/\.css$/.test(filepath) && util.detMarco(content)){
                    fs.rename(filepath, filepath.replace(/\.css/, '.less'));
                    macro.push(filepath);
                }
            });
            var config = 'fis.config.require(\'pc\');\n'
                       + 'fis.config.merge({\n'
                       + '      namespace : \'' + namespace +'\',\n'
                       + '});';
            var configPath = root + '/fis-conf.js';
            fis.util.write(configPath, config);
            fis.util.write(root + '/detect.html', createHTML(macro, widget));
        });
};

function createHTML(macro, widget){
    var html = '<!DOCTYPE html>'
        + '<html>'
        + '  <head>'
        + '     <meta charset="utf-8">'
        + '     <title>FIS 2.0 detect</title>'
        + '     <link rel="stylesheet" href="http://netdna.bootstrapcdn.com/twitter-bootstrap/2.3.2/css/bootstrap.min.css" type="text/css" />'
        + '     <style>'
        + '       .container{padding-top:10px;}'
        + '       .table th{background:whiteSmoke;}'
        + '       .table td{font-size:13px;}'
        + '     </style>'
        + '   </head>';
    var tr = '';
    for(var i = 0; i < macro.length; i++){
        tr += '<tr  class="error">'
            + '  <td style="max-width:500px;word-break:break-all;"> ' + macro[i]+ '</td>'
            + '  <td>此文件中使用了Macro，请替换为Less语法,文件后缀已修改为less,同时请修改跨模块引用此文件的引用方式.</td>'
            + '</tr>'
    }
    for(var i = 0; i < widget.length; i++){
        tr += '<tr  class="error">'
            + '  <td style="max-width:500px;word-break:break-all;"> ' + widget[i]+ '</td>'
            + '  <td >此文件中使用了widget继承，请替换此功能.</td>'
            + '</tr>'
    }
    html += '<body>'
        +      '<div class="container">'
        +          '<table class="table table-hover"><tbody>'
        +               '<tr class="table-header"><th>文件路径</th><th>检测功能</th></tr>'
        +                tr
        +          '</tbody></table>'
        +      '</div>'
        +  '</body>'
    return html;
}