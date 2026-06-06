# sandbox/demo-seed.rb
# This script initializes a fresh Redmine instance with demo data for Redmarc Sandbox.

# Check if already seeded to prevent duplicate data
if User.find_by_login('tester')
  puts "Demo data already exists. Skipping seed."
  exit 0
end

puts "Seeding Redmine with Redmarc Sandbox data..."

# 1. Ensure basic default data exists if not loaded
if IssueStatus.count == 0
  IssueStatus.create!(name: 'New', is_closed: false, position: 1)
  IssueStatus.create!(name: 'In Progress', is_closed: false, position: 2)
  IssueStatus.create!(name: 'Resolved', is_closed: true, position: 3)
  IssueStatus.create!(name: 'Closed', is_closed: true, position: 4)
end

new_status = IssueStatus.find_by(name: 'New')

if Tracker.count == 0
  t1 = Tracker.new(name: 'Bug', position: 1, is_in_roadmap: false, core_fields: Tracker::CORE_FIELDS_ALL)
  t1.default_status_id = new_status.id
  t1.save!(validate: false)

  t2 = Tracker.new(name: 'Feature', position: 2, is_in_roadmap: true, core_fields: Tracker::CORE_FIELDS_ALL)
  t2.default_status_id = new_status.id
  t2.save!(validate: false)
end

if Role.count == 0
  Role.create!(name: 'Manager', position: 1, assignable: true, issues_visibility: 'all', users_visibility: 'all')
  role = Role.create!(
    name: 'Developer',
    position: 2,
    assignable: true,
    issues_visibility: 'default',
    users_visibility: 'all',
    permissions: [:view_issues, :add_issues, :edit_issues, :add_issue_notes, :view_project]
  )
end

tracker = Tracker.first
statuses = IssueStatus.all.to_a
status_new = statuses.find { |s| s.name.downcase.include?('new') } || statuses[0]
status_prog = statuses.find { |s| s.name.downcase.include?('progress') } || statuses[1] || statuses[0]
status_closed = statuses.find { |s| s.name.downcase.include?('clos') || s.name.downcase.include?('resolv') } || statuses.last

role_dev = Role.find_by_name('Developer') || Role.create!(name: 'Developer', position: 2, assignable: true, issues_visibility: 'default', users_visibility: 'all', permissions: [:view_issues, :add_issues, :edit_issues, :add_issue_notes, :view_project])

# 2. Create the demo user (Tester)
tester = User.new(
  login: 'tester',
  firstname: 'Test',
  lastname: 'User',
  mail: 'test@arcfront.dev',
  language: 'en',
  admin: false
)
tester.password = 'password123'
tester.password_confirmation = 'password123'
tester.save!

# Enable API for the whole instance
Setting.rest_api_enabled = '1'

# 3. Create the demo project
project = Project.new(
  name: 'Redmarc Sandbox',
  identifier: 'redmarc-sandbox',
  description: 'A sandbox project for testing Redmarc UI.',
  is_public: true
)
project.save!(validate: false)

# Manually insert project_tracker link to avoid validation issues
ActiveRecord::Base.connection.execute("INSERT INTO projects_trackers (project_id, tracker_id) VALUES (#{project.id}, #{tracker.id}) ON CONFLICT DO NOTHING")

# Add tester as Developer to the project
Member.create!(
  project: project,
  principal: tester,
  role_ids: [role_dev.id]
)

# 4. Create sample issues to populate the Kanban board
puts "Creating sample issues..."

priority = IssuePriority.first || IssuePriority.create!(name: 'Normal', position: 1, is_default: true)

# Create some standalone tasks
Issue.create!(project: project, tracker: tracker, author: tester, status: status_new, priority: priority, subject: 'Design landing page mockup')
Issue.create!(project: project, tracker: tracker, author: tester, status: status_prog, priority: priority, subject: 'Setup Docker compose for sandbox', assigned_to: tester)
Issue.create!(project: project, tracker: tracker, author: tester, status: status_closed, priority: priority, subject: 'Write implementation plan')

# Create a parent issue with subtasks (for Swimlanes)
parent_issue = Issue.create!(project: project, tracker: tracker, author: tester, status: status_prog, priority: priority, subject: 'Implement User Authentication')

Issue.create!(project: project, tracker: tracker, author: tester, status: status_closed, priority: priority, subject: 'Database schema for Users', parent_issue_id: parent_issue.id)
Issue.create!(project: project, tracker: tracker, author: tester, status: status_prog, priority: priority, subject: 'Build Login API endpoints', parent_issue_id: parent_issue.id, assigned_to: tester)
Issue.create!(project: project, tracker: tracker, author: tester, status: status_new, priority: priority, subject: 'Create Frontend Login Form', parent_issue_id: parent_issue.id)

parent_issue_2 = Issue.create!(project: project, tracker: tracker, author: tester, status: status_new, priority: priority, subject: 'Release v1.0')

Issue.create!(project: project, tracker: tracker, author: tester, status: status_new, priority: priority, subject: 'Prepare marketing materials', parent_issue_id: parent_issue_2.id)
Issue.create!(project: project, tracker: tracker, author: tester, status: status_new, priority: priority, subject: 'Write release notes', parent_issue_id: parent_issue_2.id)

puts "Demo data successfully seeded! You can log in with: tester / password123"
