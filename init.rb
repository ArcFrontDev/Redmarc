require 'redmine'

Redmine::Plugin.register :arcfront do
  name 'Redmarc Frontend Plugin'
  author 'ArcFrontDev'
  description 'Modern React frontend for Redmine'
  version '0.0.1'
  url 'https://github.com/ArcFrontDev/Redmarc'
  author_url 'https://github.com/ArcFrontDev'
  
  begin
    menu :top_menu, :redmarc, { :controller => 'redmarc', :action => 'index' }, :caption => 'Redmarc'
  rescue
    # Menu item already registered – safe to skip on reload
  end
end
