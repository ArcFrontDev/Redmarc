require 'redmine'

Redmine::Plugin.register :arcfront do
  name 'Redmarc Frontend Plugin'
  author 'ArcFrontDev'
  description 'Modern React frontend for Redmine'
  version '0.0.1'
  url 'https://github.com/ArcFrontDev/Redmarc'
  author_url 'https://github.com/ArcFrontDev'
  
  # Register the menu item for the plugin
  menu :top_menu, :redmarc, { :controller => 'redmarc', :action => 'index' }, :caption => 'Redmarc'
end
