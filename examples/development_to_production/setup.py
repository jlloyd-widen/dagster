from setuptools import setup

setup(
    name="development_to_production",
    version="1.6.11",
    author_email="hello@dagsterlabs.com",
    packages=["development_to_production"],  # same as name
    install_requires=[
        "dagster",
        "dagster-snowflake",
        "dagster-snowflake-pandas",
        "pandas",
        "requests",
    ],  # external packages as dependencies
    author="Dagster Labs",
    license="Apache-2.0",
    description="Dagster example of local development and production deployment.",
    url="https://github.com/dagster-io/dagster/tree/master/examples/development_to_production",
    classifiers=[
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "License :: OSI Approved :: Apache Software License",
        "Operating System :: OS Independent",
    ],
    extras_require={"dev": ["dagster-webserver", "pytest"]},
)
