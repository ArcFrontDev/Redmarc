RedmineApp::Application.routes.draw do
  get 'redmarc', to: 'redmarc#index'
  # Catch-all route to allow React Router to handle subpaths
  get 'redmarc/*path', to: 'redmarc#index'
end
