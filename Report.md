WRD Hydrological Data Management System – Design Document

Introduction

Water‑resources managers need timely, high‑quality data on rainfall, streamflow, groundwater levels and water quality to understand catchment responses, improve flood forecasting, support infrastructure planning and engage communities.  As discussed, data are often scattered across paper archives, CSV files, monitoring devices, mobile apps and third‑party services.  This fragmentation makes it hard to see the big picture.  We want to build a Water Resource Database (WRD)—a web‑based platform that consolidates multi‑source hydrometric data, applies quality control and analysis and presents the information through interactive maps, graphs and reports.  Our solution will use DynamoDB for storage (both online in the cloud and offline on a local machine), a React + Express user application and Grafana/ThingsBoard dashboards for visualisation.  The overall design takes inspiration from the HydroPacifique site while accommodating offline operation and modern technology choices.

Stakeholders and Goals

Stakeholder
Goal / Needs
Hydrologists & scientists
Access consistent, quality‑controlled time‑series; run rating‑curves, statistics, hydrological models.
Field technicians
Upload data from monitoring stations or handheld devices; manage stations and equipment; add metadata and photos.
Decision‑makers / asset managers
Visualise catchment conditions; receive alerts; generate reports to inform policy and investments.
Community & partners
View public data; contribute manual observations; access summary dashboards.
Administrators
Manage users, permissions and data types; configure sites, devices and quality codes.
