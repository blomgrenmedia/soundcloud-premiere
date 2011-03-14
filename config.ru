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

require 'cgi'
require 'net/http'
require 'image_size'
require 'base64'
require 'json'
require 'multi_json'

use Sass::Plugin::Rack

class App < Sinatra::Base

  get '/' do
    haml :index
  end
  
  get '/waveform' do
    
    content_type 'json'
    
    # Get the URL and decode to remove any %20, etc
    
    url = CGI::unescape(params[:url])
    
    puts url
    
    # Get the contents of the URL
    
    image = Net::HTTP.get_response(URI.parse(url)).body
    
    # Get the image information
    
    size = ImageSize.new(image)
    
    # Image type
    
    type = size.get_type
    
    # Dimensions
    
    width = size.w
    height = size.h
    
    # Setup the data URL
    
    type_prefix = "data:image/" + type.downcase + ";base64,"
    
    # Encode the image into base64
    
    base64file = Base64.encode64(image)
    
    # Combine the prefix and the image
    
    data_url = type_prefix + base64file
    
    # Setup the return data
    
    return_arr = {
      :width => width,
      :height => height,
      :data => data_url
    }
    
    # Encode it into JSON
    
    MultiJson.encode(return_arr)
    
    # Wrap the callback around the JSON
    
    #return_val = '(' + return_val + ');'
    
    #return_val = $_GET["callback"] . '(' . $return_val . ');';
    
    #return return_val
    
  end
  
end

use Rack::Static, :urls => ["/stylesheets", "/images", "/js", "/swfs", "/docs"], :root => "public"
run App