# I have no idea why I made this
This is just a personal project I "worked" on to help me estimate how much time it takes to complete a course and get information from Khanacademy. Web scraping moment. Don't use this project seriously lol

# Check current data status
bun run check

# Generate study plan with custom dates
bun run plan --vacation-start 2024-08-01 --vacation-end 2024-08-15 --verbose

# Show only BC curriculum
bun run curriculum --course bc

# Force regenerate all data
bun run generate --force --verbose

# Show help
bun run planner --help