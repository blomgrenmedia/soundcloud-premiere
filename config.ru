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
require 'fbgraph'

use Sass::Plugin::Rack

class App < Sinatra::Base

  # Main Index

  get '/' do
    
    # Set lock to true if you wish to lock the stream behind a *tweet to listen*
    
    haml :index, :locals => { :lock => false }
    
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
  
  # Social Locks
  
  # Facebook Like to Unlock
  
  # If you wish to have users like your Facebook page in order to listen to the stream
  # you must first register a new Facebook app [here](https://www.facebook.com/developers/createapp.php)
  
  # Once registered, drop the app secret and set lock to true in the post method below.
  # Then, follow the instructions [here]().
  
  post '/' do
    
    @signed_request = FBGraph::Canvas.parse_signed_request('4d4e51049edcc1150e17b96823eb227e', params[:signed_request])
    
    # Set lock to true if you wish to lock the stream behind a *like to listen*
    
    haml :index, :locals => { :lock => true }
    
  end
  
  # Twitter Tweet to Unlock
  
  # If you wish to have users tweet in order to listen to the stream
  # you must first register a new Twitter app [here](http://twitter.com/apps/new).
  
  # Once registered, simply supply the app consumer key and secret 5 lines below in the configure block.
  # Then, edit the *message* javascript variable in index.haml

  enable :sessions
  
  configure do
    set :key => 'consumer_key', :secret => 'consumer_secret'    
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