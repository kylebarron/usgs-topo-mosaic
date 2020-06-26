"""Setup usgs-topo-mosaic."""

from setuptools import find_packages, setup

# Runtime requirements.
inst_reqs = [
    "cogeo-mosaic>=3.0a1",
    "lambda-proxy~=5.2",
    "rio-tiler>=2.0a6",
    "usgs-topo-tiler>=0.2.0"
]

extra_reqs = {
    "dev": ["pytest", "pytest-cov", "pre-commit", "mock"],
    "mvt": ["rio-tiler-mvt"],
    "test": ["pytest", "pytest-cov", "mock"],
}

setup(
    name="usgs-topo-mosaic",
    version="0.1.0",
    description=u"Serverless USGS Historical Topographic map tiles.",
    long_description=u"Serverless USGS Historical Topographic map tiles.",
    python_requires=">=3",
    classifiers=[
        "Intended Audience :: Information Technology",
        "Intended Audience :: Science/Research",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
    ],
    keywords="COG COGEO Mosaic GIS",
    author="Kyle Barron",
    author_email="kylebarron2@gmail.com",
    url="https://github.com/kylebarron/usgs-topo-mosaic",
    license="MIT",
    packages=find_packages(exclude=["ez_setup", "examples", "tests"]),
    include_package_data=True,
    zip_safe=False,
    install_requires=inst_reqs,
    extras_require=extra_reqs,
)
