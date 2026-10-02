# Security policy

## Supported versions

Security fixes target the latest code on `master` and its GitHub Pages deployment.
Historical commits and forks are not maintained as separate release lines.

## Reporting a vulnerability

Do not publish exploit details, credentials or personal information in public issues.
If the repository's Security tab offers **Report a vulnerability**, use that private
reporting form. Otherwise, open an issue titled **Private security contact requested**
without vulnerability details. The maintainer, [hostlife22](https://github.com/Hostlife22),
can arrange a private channel before you share the report.

Include the affected commit or site URL, reproduction steps, expected impact,
browser and operating system, and a minimal demonstration using your own data.
Do not test against other people's accounts or disrupt the public site.
There is no guaranteed response time or paid bounty program.

## Scope and handling

This project is a static browser application. It has no application login, database,
server API or required secrets. Reports about dependency vulnerabilities, unsafe
browser behavior, build scripts and GitHub Actions are relevant.

The maintainer assesses reports, prepares a fix and coordinates disclosure with the
reporter. Contributions should keep dependencies current, avoid committing secrets,
and preserve least-privilege workflow permissions. Pull requests run checks;
publication is restricted to `master` after successful checks or an explicit manual
Pages workflow run.

The supplied reference video and third-party packages retain their own licenses;
see [LICENSE](LICENSE).
