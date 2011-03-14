begin
  require ::File.expand_path('.bundle/environment', __FILE__)
rescue LoadError
  require 'rubygems'
  require 'bundler'
  Bundler.setup
end

require 'sinatra/base'
require 'haml'
require 'sass/plugin/rack'

use Sass::Plugin::Rack

class App < Sinatra::Base

  get '/' do
    haml :index
  end
  
end

use Rack::Static, :urls => ["/stylesheets", "/images", "/js", "/swfs", "/docs"], :root => "public"
run App