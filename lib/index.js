
//const { basename, dirname, extname, join } = require( 'path' )
const basename    = require( 'path' ).basename
const debug       = require( 'debug' )('metalsmith-markdown')
const dirname     = require( 'path' ).dirname
const extname     = require( 'path' ).extname
const join        = require( 'path' ).join
const markdownIt  = require( 'markdown-it' )

/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * Metalsmith plugin to convert markdown files.
 *
 * @param {Object} options (optional)
 * @return {Function}
 */

function plugin_orig(preset, options){
  var markdown = new markdownIt(preset, options),
      envSetter = function(){};

  var plugin = function(files, metalsmith, done){
    setImmediate(done);
    Object.keys(files).forEach(function(file){
      debug('checking file: %s', file);
      if (!is_markdown(file)) return;
      var data = files[file];
      var dir = dirname(file);
      var html = basename(file, extname(file)) + '.html';
      if ('.' != dir) html = join(dir, html);

      debug('converting file: %s', file);
      var env = {};
      if (envSetter) {
        env = envSetter(data, metalsmith.metadata());
      }
      var str = markdown.render(data.contents.toString(), env);
      data.contents = new Buffer(str);

      delete files[file];
      files[html] = data;
    });
  };

  plugin.parser = markdown;

  /* proxy parser methods to return plugin for inline use */

  ['use', 'set', 'enable', 'disable'].forEach(function(fn){
    plugin[fn] = function(){
      var args = Array.prototype.slice.call(arguments);
      markdown[fn].apply(markdown, args);
      return plugin;
    }
  });

  plugin.env = function(setter){
    envSetter = setter;
    return plugin;
  }

  plugin.withParser = function(fn){
    fn(markdown);
    return plugin;
  }

  return plugin;
}

/**
 *
 * @example
 *  plugin( 'presetName' )
 *
 * @example
 *
 *  plugin( 'presetName', { 'html': true } )
 *
 * @example
 *  plugin( 'presetName', { 'html': true }, 'inline' )
 * 
 * @example
 *  plugin( 'presetName' )
 *
 * @example
 *  plugin( 'presetName', { 'html': true } )
 *
 * @example
 *  plugin( { preset: 'presetName', options: { 'html': true }, render: 'inline' } )
 *
 *
 */
function plugin({ preset, options, render }){
  const mkdnItArgs = []
  let renderMethod = 'render' // Should only be changed to renderInline if needed

 
  if ( typeof preset === 'string' ){
    mkdnItArgs.push( preset )
  }

  if ( typeof options === 'object' ){
    mkdnItArgs.push( options )
  }

  if ( typeof render === 'string' && render.match( /inline/i ) ){
    renderMethod = 'renderInline'
  }  


  debug( 'Markdown args: %s', JSON.stringify( mkdnItArgs ))
  debug( 'Markdown render method: %s', renderMethod)

  // Initiate a new markdownIt object with specified args
  const markdown = new (Function.prototype.bind.apply( markdownIt, [].concat.apply( [null], mkdnItArgs ) ) )

  const envSetter = function(){}


  const plugin = ( files, metalsmith, done ) => {
    debug( 'number of files: %s', files.length )
    debug( 'file names: %s', Object.keys( files ) )

    setImmediate( done )

    Object.keys( files ).forEach(function( file ){

      debug( 'checking file: %s', file )

      if ( ! is_markdown( file ) ){
        return
      }

      const data = files[ file ]
      const dir  = dirname( file )
      const html = basename( file, extname( file ) ) + '.html'

      if ( '.' !== dir ){
        html = join( dir, html )
      } 

      debug( 'converting file: %s', file )

      let env = {}

      if ( envSetter ) {
        env = envSetter( data, metalsmith.metadata() )
      }

      const str = markdown[ renderMethod ]( data.contents.toString(), env )

      data.contents = new Buffer( str )

      delete files[file]

      files[ html ] = data
    })
  }

  plugin.parser = markdown

  /* proxy parser methods to return plugin for inline use */

  Array( 'use', 'set', 'enable', 'disable' ).forEach(function( fn, index, arrayVals ){

    plugin[ fn ] = function(){
      const args = Array.prototype.slice.call( arguments )

      markdown[ fn ].apply( markdown, args )

      return plugin
    }
  })

  plugin.env = function( setter ){
    envSetter = setter
    return plugin
  }

  plugin.withParser = function( fn ){
    fn( markdown )

    return plugin
  }

  return plugin
}

/**
 * Check if a `file` is markdown.
 *
 * @param {String} file
 * @return {Boolean}
 */

function is_markdown( file ){
  return /\.md|\.markdown/.test( extname( file ) )
}
