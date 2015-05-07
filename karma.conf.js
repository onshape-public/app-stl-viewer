module.exports = function(config) {
  config.set({
	  basePath: '.',
	  frameworks: ['jasmine'],
	  files: [
	  	'*.js',
	  	'**/*.js',
	    'tests/**/*.js'
	  ],
	  exclude: [],
	  reporters: ['progress'],
	  port: 3030,
	  colors: true,
	  logLevel: config.LOG_INFO,
	  autoWatch: true,
	  browsers: ['PhantomJS'],
	  captureTimeout: 60000,
	  singleRun: false
    });
};