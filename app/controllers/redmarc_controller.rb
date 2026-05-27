class RedmarcController < ApplicationController
  # Require a logged-in Redmine user
  before_action :require_login

  def index
    # Render without the standard Redmine layout so React controls the entire page
    render layout: false
  end
end
