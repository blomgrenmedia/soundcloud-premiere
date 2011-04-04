begin
  require ::File.expand_path('.bundle/environment', __FILE__)
rescue LoadError
  require 'rubygems'
  require 'bundler'
  Bundler.setup
end

require 'sinatra'
require 'haml'
require 'sass/plugin/rack'
require 'cgi'
require 'net/http'
require 'image_size'
require 'base64'
require 'json'
require 'omniauth'

use Sass::Plugin::Rack

class App < Sinatra::Base

  # The index page

  get '/' do
    
    haml :index, :locals => {
      :lock => false
    }
    
  end
  
  # Waveform Data
  
  get '/waveform' do
    
    content_type 'json'
    
    # Get the URL and decode to remove any %20, etc
    
    url = params[:url]
    
    # url = CGI::unescape(params[:url])
    
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
    
    return_val = MultiJson.encode(return_arr)
    
    # Wrap the callback around the JSON
    
    return_val = params[:callback] + '(' + return_val + ');'    
    
  end
  
  # Tweet to Unlock

  enable :sessions
  
  configure do
    set :key => '123', :secret => '456'    
    use OmniAuth::Strategies::Twitter, key, secret
  end  
  
  # Post & Unlock
  
  post '/unlock' do
    
    if session[:unlocked] == nil
      
      consumer = OAuth::Consumer.new(options.key, options.secret, :site => "https://twitter.com")
      
      token = OAuth::AccessToken.new(consumer, session[:user][:token], session[:user][:secret])
    
      token.post('/statuses/update.json', {:status => params[:message]})
      
      session[:unlocked] = true
      
    end
    
    "unlocked"
    
  end
  
  # Login
  
  get '/auth/:strategy/callback' do
    
    auth = request.env['omniauth.auth']
    
    session[:user] = {:token => auth['credentials']['token'], :secret => auth['credentials']['secret']}
    
    redirect "/"
    
  end
  
  # Logout
  
  get '/logout' do
    
    session[:user], session[:unlocked] = nil, nil
    redirect '/'
    
  end
  
end

use Rack::Static, :urls => ["/stylesheets", "/images", "/js", "/swfs", "/docs", "/example"], :root => "public"
run App